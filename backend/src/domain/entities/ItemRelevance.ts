import { z } from 'zod';

export const ItemRelevanceCategorySchema = z.enum([
  'emotional_insight',
  'factual_insight',
  'noise',
]);

export const ItemRelevanceSchema = z
  .object({
    itemRef: z.string().trim().min(1),
    relevant: z.boolean(),
    category: ItemRelevanceCategorySchema,
    topicScore: z.number().min(0).max(1),
    emotionScore: z.number().min(0).max(1),
    genreScore: z.number().min(0).max(1),
  })
  .strict();

export type ItemRelevanceCategory = z.infer<typeof ItemRelevanceCategorySchema>;
export type ItemRelevance = z.infer<typeof ItemRelevanceSchema>;
