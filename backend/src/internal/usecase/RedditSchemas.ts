import { z } from 'zod';

export const PostSchema = z.object({
  id: z.string(),
  title: z.string(),
  selftext: z.string(),
  ups: z.number(),
});

export const PostChildSchema = z.object({ data: PostSchema });

export const PostsResponseSchema = z.object({
  data: z.object({ children: z.array(PostChildSchema) }),
});
