import { z } from 'zod';

export const ItemSchema = z
  .object({
    itemRef: z.string().trim().min(1),
    title: z.string().trim().min(1),
    content: z.string(),
    score: z.number().finite(),
  })
  .strict();

export const WeightedItemSchema = ItemSchema.extend({
  weight: z.number().finite().nonnegative(),
}).strict();

export type Item = z.infer<typeof ItemSchema>;
export type RelevantItem = Item;
export type WeightedItem = z.infer<typeof WeightedItemSchema>;
