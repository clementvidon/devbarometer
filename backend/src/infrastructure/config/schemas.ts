import { z } from 'zod';

export const GlobalEnvSchema = z.object({
  APP_NAME: z.string().optional().default('app'),
  APP_VERSION: z.string().optional().default('0.0.0'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

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

const LOG_LEVEL_VALUES = ['debug', 'info', 'warn', 'error', 'silent'] as const;
const LogLevelEnum = z.enum(LOG_LEVEL_VALUES);

const LogLevelInputSchema = z
  .string()
  .optional()
  .transform((value) => {
    if (!value) return undefined;
    const normalized = value
      .trim()
      .toLowerCase() as (typeof LOG_LEVEL_VALUES)[number];
    return LOG_LEVEL_VALUES.includes(normalized) ? normalized : undefined;
  })
  .pipe(LogLevelEnum.optional());

const LogPrettyInputSchema = z
  .string()
  .optional()
  .transform((value) => {
    if (!value) return undefined;
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'yes')
      return true;
    if (normalized === 'false' || normalized === '0' || normalized === 'no')
      return false;
    return undefined;
  })
  .pipe(z.boolean().optional());

export const LoggingEnvSchema = z.object({
  LOG_LEVEL: LogLevelInputSchema,
  LOG_PRETTY: LogPrettyInputSchema,
});
