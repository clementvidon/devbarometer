import { z } from 'zod';
import { stripCodeFences } from '../../utils/stripCodeFences.ts';
import type {
  AverageSentiment,
  EmotionScores,
} from '../core/entity/Sentiment.ts';
import type { SentimentReport } from '../core/entity/SentimentReport.ts';
import { WEATHER_EMOJIS } from '../core/entity/SentimentReport.ts';
import type { LlmPort } from '../core/port/LlmPort.ts';
import type { AgentMessage } from '../core/types/AgentMessage.ts';

function summarizeSentiment(emotions: EmotionScores): {
  majorEmotions: { name: string; strength: string }[];
  tone: {
    value: 'neutre' | 'positif' | 'négatif' | 'polarisé';
    strength?: 'faible' | 'modéré' | 'fort';
  };
} {
  const { positive, negative, ...coreEmotions } = emotions;

  const majorEmotions = Object.entries(coreEmotions)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([name, score]) => ({
      name,
      strength:
        score < 0.2
          ? 'faible'
          : score < 0.4
            ? 'modéré'
            : score < 0.6
              ? 'fort'
              : score < 0.8
                ? 'très fort'
                : 'extrême',
    }));

  const delta = positive - negative;
  const absDelta = Math.abs(delta);

  let toneValue: 'neutre' | 'positif' | 'négatif' | 'polarisé';
  let toneStrength: 'faible' | 'modéré' | 'fort' | undefined;

  if (absDelta < 0.15 && positive > 0.4 && negative > 0.4) {
    toneValue = 'polarisé';
  } else if (delta >= 0.15) {
    toneValue = 'positif';
    toneStrength = delta < 0.3 ? 'faible' : delta < 0.5 ? 'modéré' : 'fort';
  } else if (delta <= -0.15) {
    toneValue = 'négatif';
    toneStrength = -delta < 0.3 ? 'faible' : -delta < 0.5 ? 'modéré' : 'fort';
  } else {
    toneValue = 'neutre';
  }

  return {
    majorEmotions,
    tone: {
      value: toneValue,
      ...(toneStrength ? { strength: toneStrength } : {}),
    },
  };
}

const LLMOutputSchema = z.object({
  text: z.string().max(200),
  emoji: z.enum(WEATHER_EMOJIS),
});

const FALLBACK = {
  text: '',
  emoji: '☁️',
} satisfies SentimentReport;

function makeMessages(emotionsText: string): readonly AgentMessage[] {
  return [
    {
      role: 'system' as const,
      content: `
        1. **"text"** : À partir de l'objet émotions donné, écris une **phrase courte (≤ 15 mots)** qui traduit fidèlement l’atmosphère émotionnelle en utilisant un language météo.
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

export async function generateSentimentReport(
  averageSentiment: AverageSentiment,
  llm: LlmPort,
): Promise<SentimentReport> {
  try {
    const raw = await llm.run(
      'gpt-4o-mini',
      0.1,
      makeMessages(
        JSON.stringify(summarizeSentiment(averageSentiment.emotions)),
      ),
    );
    const json: unknown = JSON.parse(stripCodeFences(raw));
    const parsed = LLMOutputSchema.safeParse(json);
    return parsed.success ? parsed.data : FALLBACK;
  } catch {
    return FALLBACK;
  }
}
