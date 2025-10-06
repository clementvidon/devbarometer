import { z } from 'zod';
import { EmotionScoresSchema, TonalityScoresSchema } from '../domain/Emotion';
import { IsoDateStringSchema } from '../primitives/date';

export const AggregatedEmotionProfileDtoSchema = z.object({
  createdAt: IsoDateStringSchema,
  count: z.number().int().nonnegative(),
  totalWeight: z.number().nonnegative(),
  emotions: EmotionScoresSchema,
  tonalities: TonalityScoresSchema,
});
export type AggregatedEmotionProfileDto = z.infer<
  typeof AggregatedEmotionProfileDtoSchema
>;
