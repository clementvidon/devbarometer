import {
  EmotionScoresSchema,
  TonalityScoresSchema,
} from '@devbarometer/shared/domain';
import z from 'zod';

export const AggregatedSentimentProfileSchema = z
  .object({
    count: z.number().int().nonnegative(),
    totalWeight: z.number().finite().nonnegative(),
    emotions: EmotionScoresSchema,
    tonalities: TonalityScoresSchema,
  })
  .strict();

export type AggregatedSentimentProfile = z.infer<
  typeof AggregatedSentimentProfileSchema
>;
