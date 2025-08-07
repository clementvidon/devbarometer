import pLimit from 'p-limit';
import { z } from 'zod';
import { stripCodeFences } from '../../utils/stripCodeFences.ts';
import type {
  EmotionProfile,
  EmotionScores,
  TonalityScores,
} from '../core/entity/EmotionProfile.ts';
import type { RelevantPost } from '../core/entity/Post.ts';
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

function emotionMessages(post: RelevantPost): readonly AgentMessage[] {
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

Texte : """${post.title}\n\n${post.content}"""`.trim(),
    },
  ];
}

function tonalityMessages(post: RelevantPost): readonly AgentMessage[] {
  return [
    {
      role: 'system',
      content: `
Tu es un assistant chargé d’évaluer le ton général d’un post Reddit.

Pour ce faire, donne un score entre 0 et 1 pour :

- valence positive
- valence négative
- surprise (degré d’inattendu)
- anticipation (degré de projection future)

Donne aussi une indication qualitative sur le type d’anticipation et de surprise (positive ou négative).

Format JSON :
{
  "positive": number,
  "negative": number,
  "positive_surprise": number,
  "negative_surprise": number,
  "optimistic_anticipation": number,
  "pessimistic_anticipation": number
}

Texte : """${post.title}\n\n${post.content}"""`.trim(),
    },
  ];
}

async function fetchEmotions(
  post: RelevantPost,
  llm: LlmPort,
): Promise<EmotionScores> {
  try {
    const raw = await llm.run('gpt-4o-mini', 0.1, emotionMessages(post));
    const json: unknown = JSON.parse(stripCodeFences(raw));
    const parsed = EmotionSchema.safeParse(json);
    return parsed.success ? parsed.data : FALLBACK_EMOTIONS;
  } catch {
    return FALLBACK_EMOTIONS;
  }
}

async function fetchTonalities(
  post: RelevantPost,
  llm: LlmPort,
): Promise<TonalityScores> {
  try {
    const raw = await llm.run('gpt-4o-mini', 0.1, tonalityMessages(post));
    const json: unknown = JSON.parse(stripCodeFences(raw));
    const parsed = TonalitySchema.safeParse(json);
    return parsed.success ? parsed.data : FALLBACK_TONALITIES;
  } catch {
    return FALLBACK_TONALITIES;
  }
}

export async function analyzeEmotionProfiles(
  posts: RelevantPost[],
  llm: LlmPort,
): Promise<EmotionProfile[]> {
  if (posts.length === 0) {
    console.error('[analyzeEmotionProfiles] Received empty posts array.');
    return [];
  }

  const limit = pLimit(CONCURRENCY);

  const emotionProfiles = posts.map((post) =>
    limit(async () => {
      const [emotions, tonalities] = await Promise.all([
        fetchEmotions(post, llm),
        fetchTonalities(post, llm),
      ]);

      return {
        title: post.title,
        source: post.id,
        weight: post.upvotes,
        emotions,
        tonalities,
      };
    }),
  );

  return Promise.all(emotionProfiles);
}
