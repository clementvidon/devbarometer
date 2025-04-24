import { z } from 'zod';
import pLimit from 'p-limit';
import type { LlmPort } from '../core/port/LlmPort';
import type { Post } from '../core/entity/Post';
import { stripCodeFences } from '../../utils/stripCodeFences';

const CONCURRENCY = 10;
const EmotionSchema = z.object({
  anger: z.number().min(0).max(1),
  fear: z.number().min(0).max(1),
  anticipation: z.number().min(0).max(1),
  trust: z.number().min(0).max(1),
  surprise: z.number().min(0).max(1),
  sadness: z.number().min(0).max(1),
  joy: z.number().min(0).max(1),
  disgust: z.number().min(0).max(1),
  negative: z.number().min(0).max(1),
  positive: z.number().min(0).max(1),
});
type EmotionScores = z.infer<typeof EmotionSchema>;

const FALLBACK: EmotionScores = {
  anger: 0,
  fear: 0,
  anticipation: 0,
  trust: 0,
  surprise: 0,
  sadness: 0,
  joy: 0,
  disgust: 0,
  negative: 0,
  positive: 0,
};

function makeMessages(post: Post) {
  return [
    {
      role: 'system' as const,
      content: `
      Vous êtes un expert en analyse émotionnelle selon le NRC Emotion Lexicon.
        Analysez la donnée fourni dans son entièreté et répondez STRICTEMENT par un JSON brut contenant uniquement ces clés :
        anger, fear, anticipation, trust, surprise, sadness, joy, disgust, negative, positive.
        Les valeurs doivent être des nombres entre 0.0 et 1.0.
        Aucune autre clé, explication ou mise en forme.
        `.trim(),
    },
    {
      role: 'user' as const,
      content: `
      Analysez ces données :
        titre        : ${post.title}
      contenu      : ${post.content}
      meilleur com.: ${post.topComment}
      `.trim(),
    },
  ];
}

async function fetchEmotions(post: Post, llm: LlmPort): Promise<EmotionScores> {
  try {
    const raw = await llm.run('gpt-4o-mini', makeMessages(post));
    const json = JSON.parse(stripCodeFences(raw));
    const parsed = EmotionSchema.safeParse(json);
    return parsed.success ? parsed.data : FALLBACK;
  } catch {
    return FALLBACK;
  }
}

export type SentimentResult = {
  title: string;
  upvotes: number;
  emotions: EmotionScores;
};

export async function analyzeSentiments(
  posts: Post[],
  llm: LlmPort,
): Promise<SentimentResult[]> {
  const limit = pLimit(CONCURRENCY);
  const sentiments = posts.map((post) =>
    limit(async () => ({
      title: post.title,
      upvotes: post.upvotes,
      emotions: await fetchEmotions(post, llm),
    })),
  );
  return Promise.all(sentiments);
}
