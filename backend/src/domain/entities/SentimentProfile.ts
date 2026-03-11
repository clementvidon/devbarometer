import {
  EmotionScoresSchema,
  TonalityScoresSchema,
} from '@devbarometer/shared/domain';
import z from 'zod';

export const SentimentProfileSchema = z
  .object({
    itemRef: z.string().trim().min(1),
    status: z.enum(['ok', 'fallback']),
    emotions: EmotionScoresSchema,
    tonalities: TonalityScoresSchema,
  })
  .strict();

export const WeightedSentimentProfileSchema = SentimentProfileSchema.extend({
  weight: z.number().finite().nonnegative(),
}).strict();

export type SentimentProfile = z.infer<typeof SentimentProfileSchema>;
export type WeightedSentimentProfile = z.infer<
  typeof WeightedSentimentProfileSchema
>;
