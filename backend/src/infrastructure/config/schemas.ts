import { z } from 'zod';

export const CoreEnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL missing'),
});

export const LlmEnvSchema = z.object({
  LLM_PROVIDER: z.enum(['openai', 'local']).default('openai'),
  OPENAI_API_KEY: z.string().optional(),
});

export const RedditEnvSchema = z.object({
  REDDIT_URL: z.string().url('REDDIT_URL must be a valid URL').optional(),
  REDDIT_CLIENT_ID: z.string().optional(),
  REDDIT_CLIENT_SECRET: z.string().optional(),
  REDDIT_USERNAME: z.string().optional(),
  REDDIT_PASSWORD: z.string().optional(),
});
