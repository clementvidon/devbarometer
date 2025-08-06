import { z } from 'zod';

export const RedditPostSchema = z.object({
  data: z.object({
    id: z.string(),
    title: z.string(),
    selftext: z.string(),
    ups: z.number(),
  }),
});

export const PostsResponseSchema = z.object({
  data: z.object({
    children: z.array(RedditPostSchema),
  }),
});
