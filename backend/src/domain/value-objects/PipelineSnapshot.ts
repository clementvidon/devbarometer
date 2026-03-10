import {
  EmotionScoresSchema,
  IsoDateStringSchema,
  ReportSchema,
  TonalityScoresSchema,
} from '@devbarometer/shared';
import z from 'zod';

export const ItemSchema = z
  .object({
    itemRef: z.string(),
    title: z.string(),
    content: z.string(),
    score: z.number(),
  })
  .strict();

export const WeightedItemSchema = ItemSchema.extend({
  weight: z.number().finite(),
}).strict();

export const SentimentProfileSchema = z
  .object({
    itemRef: z.string(),
    status: z.enum(['ok', 'fallback']),
    emotions: EmotionScoresSchema,
    tonalities: TonalityScoresSchema,
  })
  .strict();

export const WeightedSentimentProfileSchema = SentimentProfileSchema.extend({
  weight: z.number().finite(),
}).strict();

export const AggregatedSentimentProfileSchema = z
  .object({
    count: z.number().int().nonnegative(),
    totalWeight: z.number().finite(),
    emotions: EmotionScoresSchema,
    tonalities: TonalityScoresSchema,
  })
  .strict();

export const SnapshotDataSchema = z
  .object({
    fetchRef: z.string(),
    inputItems: z.array(ItemSchema),
    weightedItems: z.array(WeightedItemSchema),
    weightedSentimentProfiles: z.array(WeightedSentimentProfileSchema),
    aggregatedSentimentProfile: AggregatedSentimentProfileSchema,
    report: ReportSchema,
  })
  .strict();
export type SnapshotData = z.infer<typeof SnapshotDataSchema>;

export const PipelineSnapshotSchema = SnapshotDataSchema.extend({
  id: z.string().uuid(),
  createdAt: IsoDateStringSchema,
}).strict();
export type PipelineSnapshot = z.infer<typeof PipelineSnapshotSchema>;
