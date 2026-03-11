import { z } from 'zod';

export const EmotionScoresSchema = z.object({
  joy: z.number().min(0).max(1),
  trust: z.number().min(0).max(1),
  anger: z.number().min(0).max(1),
  fear: z.number().min(0).max(1),
  sadness: z.number().min(0).max(1),
  disgust: z.number().min(0).max(1),
});
export type EmotionScores = z.infer<typeof EmotionScoresSchema>;

export const EMOTION_SCORE_FIELDS = [
  'joy',
  'trust',
  'anger',
  'fear',
  'sadness',
  'disgust',
] as const;
export type EmotionScoreField = (typeof EMOTION_SCORE_FIELDS)[number];
