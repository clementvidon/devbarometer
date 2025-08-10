import pLimit from 'p-limit';
import { z } from 'zod';
import { stripCodeFences } from '../../utils/stripCodeFences.ts';
import type {
  EmotionProfile,
  EmotionScores,
  TonalityScores,
} from '../core/entity/EmotionProfile.ts';
import type { RelevantItem } from '../core/entity/Item.ts';
import type { LlmPort } from '../core/port/LlmPort.ts';
import type { AgentMessage } from '../core/types/AgentMessage.ts';

const CONCURRENCY = 10;

const EmotionSchema = z.object({
  joy: z.number().min(0).max(1),
  trust: z.number().min(0).max(1),
  anger: z.number().min(0).max(1),
  fear: z.number().min(0).max(1),
  sadness: z.number().min(0).max(1),
  disgust: z.number().min(0).max(1),
});

const TonalitySchema = z.object({
  positive: z.number().min(0).max(1),
  negative: z.number().min(0).max(1),
  positive_surprise: z.number().min(0).max(1),
  negative_surprise: z.number().min(0).max(1),
  optimistic_anticipation: z.number().min(0).max(1),
  pessimistic_anticipation: z.number().min(0).max(1),
});

const FALLBACK_EMOTIONS: EmotionScores = {
  joy: 0,
  trust: 0,
  anger: 0,
  fear: 0,
  sadness: 0,
  disgust: 0,
};

const FALLBACK_TONALITIES: TonalityScores = {
  positive: 0,
  negative: 0,
  positive_surprise: 0,
  negative_surprise: 0,
  optimistic_anticipation: 0,
  pessimistic_anticipation: 0,
};

function emotionMessages(item: RelevantItem): readonly AgentMessage[] {
  return [
    {
      role: 'system',
      content: `
Tu es un analyste émotionnel. Ton rôle est de mesurer l’intensité des émotions présentes dans un texte Reddit, selon la taxonomie suivante :

- joy
- trust
- anger
- fear
- sadness
- disgust

Donne une note entre 0 et 1 pour chaque émotion, même si elle est faible ou absente. Ne commente pas.

Format JSON strict :
{
  "joy": number,
  "trust": number,
  "anger": number,
  "fear": number,
  "sadness": number,
  "disgust": number
}

Texte : """${item.title}\n\n${item.content}"""`.trim(),
    },
  ];
}

function tonalityMessages(item: RelevantItem): readonly AgentMessage[] {
  return [
    {
      role: 'system',
      content: `
Tu es un assistant chargé d’évaluer le ton général d’un item Reddit.

Pour ce faire, donne un score entre 0 et 1 (indépendants, ils ne doivent pas nécessairement totaliser 1) pour :

- polarité positive
- polarité négative
- surprise positive (degré d’inattendu)
- surprise négative (degré d’inattendu)
- anticipation optimiste (degré de projection future)
- anticipation pessimiste (degré de projection future)

Format JSON strict :
{
  "positive": number,                // 0 à 1
  "negative": number,                // 0 à 1
  "positive_surprise": number,       // 0 à 1
  "negative_surprise": number,       // 0 à 1
  "optimistic_anticipation": number, // 0 à 1
  "pessimistic_anticipation": number // 0 à 1
}

Texte : """${item.title}\n\n${item.content}"""`.trim(),
    },
  ];
}

async function fetchEmotions(
  item: RelevantItem,
  llm: LlmPort,
): Promise<EmotionScores> {
  try {
    const raw = await llm.run('gpt-4o-mini', 0.1, emotionMessages(item));
    const json: unknown = JSON.parse(stripCodeFences(raw));
    const parsed = EmotionSchema.safeParse(json);
    return parsed.success ? parsed.data : FALLBACK_EMOTIONS;
  } catch {
    return FALLBACK_EMOTIONS;
  }
}

async function fetchTonalities(
  item: RelevantItem,
  llm: LlmPort,
): Promise<TonalityScores> {
  try {
    const raw = await llm.run('gpt-4o-mini', 0.1, tonalityMessages(item));
    const json: unknown = JSON.parse(stripCodeFences(raw));
    const parsed = TonalitySchema.safeParse(json);
    return parsed.success ? parsed.data : FALLBACK_TONALITIES;
  } catch {
    return FALLBACK_TONALITIES;
  }
}

export async function createEmotionProfiles(
  items: RelevantItem[],
  llm: LlmPort,
): Promise<EmotionProfile[]> {
  if (items.length === 0) {
    console.error('[createEmotionProfiles] Received empty items array.');
    return [];
  }

  const limit = pLimit(CONCURRENCY);

  const emotionProfiles = items.map((item) =>
    limit(async () => {
      const [emotions, tonalities] = await Promise.all([
        fetchEmotions(item, llm),
        fetchTonalities(item, llm),
      ]);

      return {
        title: item.title,
        source: item.source,
        weight: item.weight,
        emotions,
        tonalities,
      };
    }),
  );

  return Promise.all(emotionProfiles);
}
