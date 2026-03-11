import { ReportSchema } from '@devbarometer/shared/domain';
import { IsoDateStringSchema } from '@devbarometer/shared/primitives';
import { z } from 'zod';
import {
  AggregatedSentimentProfileSchema,
  ItemSchema,
  WeightedItemSchema,
  WeightedSentimentProfileSchema,
} from '../entities';

const EPSILON = 1e-9;
function approxEqual(a: number, b: number, epsilon = EPSILON): boolean {
  return Math.abs(a - b) <= epsilon;
}

export const SnapshotDataShape = z
  .object({
    fetchRef: z.string().trim().min(1),
    inputItems: z.array(ItemSchema),
    weightedItems: z.array(WeightedItemSchema),
    weightedSentimentProfiles: z.array(WeightedSentimentProfileSchema),
    aggregatedSentimentProfile: AggregatedSentimentProfileSchema,
    report: ReportSchema,
  })
  .strict();

type SnapshotDataShapeValue = z.infer<typeof SnapshotDataShape>;

function validateSnapshotConsistency(
  snapshot: SnapshotDataShapeValue,
  ctx: z.RefinementCtx,
) {
  const {
    weightedItems,
    weightedSentimentProfiles,
    aggregatedSentimentProfile,
  } = snapshot;

  if (weightedItems.length !== weightedSentimentProfiles.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['weightedSentimentProfiles'],
      message:
        'weightedItems and weightedSentimentProfiles must have the same length.',
    });
  }

  const pairCount = Math.min(
    weightedItems.length,
    weightedSentimentProfiles.length,
  );

  for (let i = 0; i < pairCount; i++) {
    const item = weightedItems[i];
    const profile = weightedSentimentProfiles[i];

    if (item.itemRef !== profile.itemRef) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['weightedSentimentProfiles', i, 'itemRef'],
        message:
          'weightedItems and weightedSentimentProfiles must stay aligned.',
      });
    }

    if (profile.status === 'fallback' && profile.weight !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['weightedSentimentProfiles', i, 'weight'],
        message: 'Fallback sentiment profiles must have weight 0.',
      });
    }
  }

  if (aggregatedSentimentProfile.count !== weightedSentimentProfiles.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['aggregatedSentimentProfile', 'count'],
      message: 'Aggregated count must match weightedSentimentProfiles.length.',
    });
  }

  const totalWeight = weightedSentimentProfiles.reduce(
    (sum, profile) => sum + profile.weight,
    0,
  );

  if (!approxEqual(aggregatedSentimentProfile.totalWeight, totalWeight)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['aggregatedSentimentProfile', 'totalWeight'],
      message: 'Aggregated totalWeight must equal the sum of profile weights.',
    });
  }
}

export const SnapshotDataSchema = SnapshotDataShape.superRefine(
  validateSnapshotConsistency,
);

export const PipelineSnapshotSchema = SnapshotDataShape.extend({
  id: z.string().uuid(),
  createdAt: IsoDateStringSchema,
})
  .strict()
  .superRefine(validateSnapshotConsistency);

export type SnapshotData = z.infer<typeof SnapshotDataSchema>;
export type PipelineSnapshot = z.infer<typeof PipelineSnapshotSchema>;
