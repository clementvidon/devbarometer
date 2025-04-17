import { runLLM } from '../llm/llm';
import { z } from 'zod';
import pLimit from 'p-limit';
import type { DataPoint } from '../reddit/types';

const CONCURRENCY_LIMIT = 10;

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
export type EmotionScores = z.infer<typeof EmotionSchema>;

export type SentimentResult = {
  title: string;
  upvotes: number;
  emotions: EmotionScores;
};

const makeSentimentMessages = (dp: DataPoint) => [
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
    titre        : ${dp.title}
    contenu      : ${dp.content}
    meilleur com.: ${dp.topComment}
    `.trim(),
  },
];

function stripCodeFences(raw: string): string {
  return raw
    .split('\n')
    .filter((line) => !line.includes('```'))
    .join('\n')
    .trim();
}

const EMPTY_EMOTIONS: EmotionScores = {
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

async function fetchEmotions(dp: DataPoint): Promise<EmotionScores> {
  try {
    const raw = await runLLM('gpt-4o-mini', makeSentimentMessages(dp));
    const cleaned = stripCodeFences(raw);
    const parsed = JSON.parse(cleaned);
    const result = EmotionSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.format()));
    }
    return result.data;
  } catch (error) {
    console.error(`Error at "${dp.title}" :`, error);
    return EMPTY_EMOTIONS;
  }
}

export async function analyzeSentiments(
  dataPoints: DataPoint[],
): Promise<SentimentResult[]> {
  const limit = pLimit(CONCURRENCY_LIMIT);
  const sentiments = dataPoints.map((dp) =>
    limit(async () => {
      const emotions = await fetchEmotions(dp);
      return {
        title: dp.title,
        upvotes: dp.upvotes,
        emotions,
      };
    }),
  );
  const results = await Promise.all(sentiments);
  console.log(`Analyzed ${results.length}/${dataPoints.length} posts.`);
  return results;
}
