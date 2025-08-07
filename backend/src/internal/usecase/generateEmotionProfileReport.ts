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

type ToneValue = 'neutre' | 'positif' | 'négatif' | 'polarisé';
type ToneStrength = 'faible' | 'modéré' | 'fort';

type Tone = {
  value: ToneValue;
  strength?: ToneStrength;
};

type EmotionSummary = {
  majorEmotions: { name: string; strength: string }[];
  valence: Tone;
  anticipation: Tone;
  surprise: Tone;
};

function evaluateTone(positive: number, negative: number): Tone {
  const delta = positive - negative;
  const absDelta = Math.abs(delta);

  if (absDelta < 0.15 && positive > 0.4 && negative > 0.4) {
    return { value: 'polarisé' };
  }

  if (delta >= 0.15) {
    const strength: ToneStrength =
      delta < 0.3 ? 'faible' : delta < 0.5 ? 'modéré' : 'fort';
    return { value: 'positif', strength };
  }

  if (delta <= -0.15) {
    const strength: ToneStrength =
      -delta < 0.3 ? 'faible' : -delta < 0.5 ? 'modéré' : 'fort';
    return { value: 'négatif', strength };
  }

  return { value: 'neutre' };
}

function strengthLabel(score: number): string {
  return score < 0.2
    ? 'faible'
    : score < 0.4
      ? 'modéré'
      : score < 0.6
        ? 'fort'
        : score < 0.8
          ? 'très fort'
          : 'extrême';
}

export function summarizeEmotionProfile(
  profile: AggregatedEmotionProfile,
): EmotionSummary {
  const { emotions, tonalities } = profile;

  const majorEmotions = (
    Object.entries(emotions) as [keyof EmotionScores, number][]
  ).map(([name, score]) => ({
    name,
    strength: strengthLabel(score),
  }));

  return {
    majorEmotions,
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

const LLMOutputSchema = z.object({
  text: z.string().max(200),
  emoji: z.enum(WEATHER_EMOJIS),
});

const FALLBACK = {
  text: '',
  emoji: '☁️',
} satisfies EmotionProfileReport;

function makeMessages(emotionsText: string): readonly AgentMessage[] {
  return [
    {
      role: 'system' as const,
      content: `
        1. **"text"** : À partir de l'objet émotions donné, écris une **phrase courte (≤ 15 mots)** qui traduit fidèlement l’atmosphère émotionnelle en utilisant un langage météo. Assure toi que la phrase ait un sens et soit pertinente.
        2. **"emoji"** : Parmi : ${WEATHER_EMOJIS.join(' ')} choisi le symbol le plus évocateur de la phrase **"text"**.

        Retourne un JSON brut avec uniquement ces deux clés.
        `.trim(),
    },
    {
      role: 'user' as const,
      content: `
      Voici l'objet émotion JSON :
        ${emotionsText}
      `.trim(),
    },
  ] as const satisfies readonly AgentMessage[];
}

export async function generateEmotionProfileReport(
  agregatedEmotionProfile: AggregatedEmotionProfile,
  llm: LlmPort,
): Promise<EmotionProfileReport> {
  try {
    const raw = await llm.run(
      'gpt-4o-mini',
      0.1,
      makeMessages(
        JSON.stringify(summarizeEmotionProfile(agregatedEmotionProfile)),
      ),
    );
    const json: unknown = JSON.parse(stripCodeFences(raw));
    const parsed = LLMOutputSchema.safeParse(json);
    return parsed.success ? parsed.data : FALLBACK;
  } catch {
    return FALLBACK;
  }
}
