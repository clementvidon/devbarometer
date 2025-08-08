import { z } from 'zod';

export const RedditItemSchema = z.object({
  data: z.object({
    id: z.string(),
    title: z.string(),
    selftext: z.string(),
    ups: z.number(),
  }),
});

export const ItemsResponseSchema = z.object({
  data: z.object({
    children: z.array(RedditItemSchema),
  }),
});
