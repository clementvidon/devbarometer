import { z } from 'zod';
import { IsoDateStringSchema } from '../primitives/date';

export const EmotionScoresSchema = z.object({
  joy: z.number().min(0).max(1),
  trust: z.number().min(0).max(1),
  anger: z.number().min(0).max(1),
  fear: z.number().min(0).max(1),
  sadness: z.number().min(0).max(1),
  disgust: z.number().min(0).max(1),
});
export type EmotionScores = z.infer<typeof EmotionScoresSchema>;

export const TonalityScoresSchema = z.object({
  positive: z.number().min(0).max(1),
  negative: z.number().min(0).max(1),
  positive_surprise: z.number().min(0).max(1),
  negative_surprise: z.number().min(0).max(1),
  optimistic_anticipation: z.number().min(0).max(1),
  pessimistic_anticipation: z.number().min(0).max(1),
});
export type TonalityScores = z.infer<typeof TonalityScoresSchema>;

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

export const ChartEntrySchema = z.object({
  createdAt: IsoDateStringSchema,
  emotions: z.record(z.number().min(0).max(1)),
  tonalities: TonalityScoresSchema.optional(),
});
export type ChartEntry = z.infer<typeof ChartEntrySchema>;

export const ChartEntriesSchema = z.array(ChartEntrySchema);
export function parseChartEntries(input: unknown): ChartEntry[] {
  return ChartEntriesSchema.parse(input);
}
