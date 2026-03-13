import { z } from 'zod';

import { EmotionScoresSchema, TonalityScoresSchema } from '../domain';
import { IsoDateStringSchema } from '../primitives/date';

export const AggregatedSentimentProfileDtoSchema = z
  .object({
    createdAt: IsoDateStringSchema,
    count: z.number().int().nonnegative(),
    confidenceMass: z.number().nonnegative(),
    emotions: EmotionScoresSchema,
    tonalities: TonalityScoresSchema,
  })
  .brand<'AggregatedSentimentProfileDto'>();
export type AggregatedSentimentProfileDto = z.infer<
  typeof AggregatedSentimentProfileDtoSchema
>;
