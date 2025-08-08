import { z } from 'zod';
import { stripCodeFences } from '../../utils/stripCodeFences.ts';
import type {
  AggregatedEmotionProfile,
  EmotionScores,
} from '../core/entity/EmotionProfile.ts';
import type { EmotionProfileReport } from '../core/entity/EmotionProfileReport.ts';
import { WEATHER_EMOJIS } from '../core/entity/EmotionProfileReport.ts';
import type { LlmPort } from '../core/port/LlmPort.ts';
import type { AgentMessage } from '../core/types/AgentMessage.ts';

/* pickStandoutsByScore */

type Standout = { name: keyof EmotionScores; score: number };

const MIN_STANDOUT = 0.35;
const MAX_STANDOUTS = 2;
const REL_GAP = 0.06;
const EPS = 1e-6;

function pickStandoutsByScore(emotions: EmotionScores): Standout[] {
  const sorted = (Object.entries(emotions) as [keyof EmotionScores, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([name, score]) => ({ name, score }));

  const first = sorted[0];
  const second = sorted[1];

  if (!first) return [];

  const res: Standout[] = [];
  if (first.score + EPS >= MIN_STANDOUT) res.push(first);

  if (
    second &&
    (second.score + EPS >= MIN_STANDOUT ||
      first.score - second.score <= REL_GAP)
  ) {
    res.push(second);
  }

  return res.slice(0, MAX_STANDOUTS);
}

/* evaluateTone */

type Tone = {
  value: 'neutral' | 'positive' | 'negative' | 'polarized';
  strength?: 'very weak' | 'weak' | 'moderate' | 'strong' | 'very strong';
};

function getStrengthLabel(score: number): Tone['strength'] {
  return score < 0.2
    ? 'very weak'
    : score < 0.4
      ? 'weak'
      : score < 0.6
        ? 'moderate'
        : score < 0.8
          ? 'strong'
          : 'very strong';
}

const POLARITY_MIN = 0.3;
const POLARITY_DELTA = 0.06;
const NEUTRAL_DELTA = 0.06;

function evaluateTone(positive: number, negative: number): Tone {
  const delta = positive - negative;
  const absDelta = Math.abs(delta);
  const max = Math.max(positive, negative);
  const min = Math.min(positive, negative);

  if (max > POLARITY_MIN && min > POLARITY_MIN && absDelta < POLARITY_DELTA) {
    return {
      value: 'polarized',
      strength: getStrengthLabel(max),
    };
  }

  if (absDelta < NEUTRAL_DELTA) {
    return { value: 'neutral' };
  }

  return {
    value: delta > 0 ? 'positive' : 'negative',
    strength: getStrengthLabel(absDelta),
  };
}

/* summarizeEmotionProfile */

type EmotionProfileSummary = {
  emotions: { name: keyof EmotionScores; strength: Tone['strength'] }[];
  standoutEmotions: Standout[];
  valence: Tone;
  anticipation: Tone;
  surprise: Tone;
};

export function summarizeEmotionProfile(
  profile: AggregatedEmotionProfile,
): EmotionProfileSummary {
  const { emotions, tonalities } = profile;

  const summary = (
    Object.entries(emotions) as [keyof EmotionScores, number][]
  ).map(([name, score]) => ({
    name,
    strength: getStrengthLabel(score),
  }));

  return {
    emotions: summary,
    standoutEmotions: pickStandoutsByScore(profile.emotions),
    valence: evaluateTone(tonalities.positive, tonalities.negative),
    anticipation: evaluateTone(
      tonalities.optimistic_anticipation,
      tonalities.pessimistic_anticipation,
    ),
    surprise: evaluateTone(
      tonalities.positive_surprise,
      tonalities.negative_surprise,
    ),
  };
}

/* generateEmotionProfileReport */

const LLMOutputSchema = z.object({
  text: z.string().max(200),
  emoji: z.enum(WEATHER_EMOJIS),
});

const FALLBACK = {
  text: '',
  emoji: '☁️',
} satisfies EmotionProfileReport;

function makeMessages(summary: EmotionProfileSummary): readonly AgentMessage[] {
  return [
    {
      role: 'system' as const,
      content: `
      Tu es un expert en analyse émotionnelle qui traduit un profil émotionnel en une **brève description météo**.

        Tu recevras un objet JSON contenant :
        - un champ "emotions" : liste des 6 émotions humaines de base avec leur intensité,
      - un champ "standoutEmotions" : liste (éventuellement vide) des émotions dont l'intensité ≥ ${MIN_STANDOUT}, triées par intensité décroissante,
      - trois tonalités globales : "valence", "anticipation" et "surprise" (avec direction et force).

        Ta tâche :

        1. Crée une **phrase courte (max 15 mots)** décrivant l'ambiance émotionnelle, en t’inspirant du style météo.
        2. Si toutes les émotions et tonalités sont ≤ "weak" et "standoutEmotions" est vide : décris une atmosphère **neutre, indécise ou calme**.
        3. Sinon, mentionne uniquement ce qui ressort clairement : tonalités ≥ "moderate" et émotions dans "standoutEmotions".
        4. Évite les redondances et n’invente rien qui ne soit pas présent dans les données.
        5. Assure-toi que la phrase ait un sens, soit grammaticalement correcte et pertinente.
        6. Choisi un émoji météo qui doit accentuer l'expression de la tendance (ex. négative vs positive) exprimée dans ta phrase : ${WEATHER_EMOJIS.join(' ')}

      Retourne uniquement un JSON brut :
        {
        "text": string,
        "emoji": string
      }
      `.trim(),
    },
    {
      role: 'user' as const,
      content: `Voici le profil émotionnel JSON :\n${JSON.stringify(summary)}`,
    },
  ];
}

export async function generateEmotionProfileReport(
  agregatedEmotionProfile: AggregatedEmotionProfile,
  llm: LlmPort,
): Promise<EmotionProfileReport> {
  try {
    const summary = summarizeEmotionProfile(agregatedEmotionProfile);
    console.log(summary);
    const raw = await llm.run('gpt-4o-mini', 0.1, makeMessages(summary));
    const json: unknown = JSON.parse(stripCodeFences(raw));
    const parsed = LLMOutputSchema.safeParse(json);
    return parsed.success ? parsed.data : FALLBACK;
  } catch (err) {
    console.error('[generateEmotionProfileReport] LLM error:', err);
    return FALLBACK;
  }
}
