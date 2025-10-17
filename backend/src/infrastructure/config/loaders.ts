import { z } from 'zod';
import type { LoggingConfig } from './schemas';
import {
  CoreEnvSchema,
  LlmEnvSchema,
  LoggingEnvSchema,
  RedditEnvSchema,
  toLoggingConfig,
} from './schemas';

/* ---------- helpers ---------- */

type Env = typeof process.env;

export class ConfigError extends Error {}

function prettyErrors(issues: z.ZodIssue[]) {
  return issues
    .map((i) => `${i.path.length ? i.path.join('.') : '(root)'}: ${i.message}`)
    .join('; ');
}

export function parseEnv<Output, Input = Output>(
  schema: z.ZodType<Output, z.ZodTypeDef, Input>,
  env: Env = process.env,
): Output {
  const parsed = schema.safeParse(env);
  if (parsed.success) return parsed.data;
  throw new ConfigError(`Invalid env: ${prettyErrors(parsed.error.issues)}`);
}

/* ---------- core ---------- */
export type CoreConfig = {
  port: number;
  databaseUrl: string;
};

export function loadCoreConfig(env: Env = process.env): CoreConfig {
  const parsed = parseEnv(CoreEnvSchema, env);
  const port = parsed.PORT ?? 3000;
  return { port, databaseUrl: parsed.DATABASE_URL };
}

/* ---------- logging ---------- */

export function loadLoggingConfig(env: Env = process.env): LoggingConfig {
  const parsed = parseEnv(LoggingEnvSchema, env);
  return toLoggingConfig(parsed);
}

/* ---------- replay ---------- */
export type ReplayConfig = {
  databaseUrl: string;
  openaiApiKey: string;
};

export function loadReplayConfig(env: Env = process.env): ReplayConfig {
  const core = parseEnv(CoreEnvSchema, env);
  const llm = parseEnv(LlmEnvSchema, env);

  if (llm.LLM_PROVIDER !== 'openai')
    throw new ConfigError('Replay requires LLM_PROVIDER=openai');
  if (!llm.OPENAI_API_KEY)
    throw new ConfigError('Replay requires OPENAI_API_KEY');

  return {
    databaseUrl: core.DATABASE_URL,
    openaiApiKey: llm.OPENAI_API_KEY,
  };
}

/* ---------- reporting agent ---------- */
export type RedditConfig = {
  url: string;
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
};

export type LlmProvider = z.infer<typeof LlmEnvSchema>['LLM_PROVIDER'];

export type ReportingAgentConfig = {
  port: number;
  databaseUrl: string;
  openaiApiKey: string;
  reddit: RedditConfig;
  llmProvider: LlmProvider;
};

export function loadReportingAgentConfig(
  env: Env = process.env,
): ReportingAgentConfig {
  const core = parseEnv(CoreEnvSchema, env);
  const llm = parseEnv(LlmEnvSchema, env);
  const reddit = parseEnv(RedditEnvSchema, env);

  const openaiApiKey = llm.OPENAI_API_KEY;
  if (llm.LLM_PROVIDER !== 'openai')
    throw new ConfigError('Reporting agent requires OpenAI as LLM_PROVIDER');
  if (!openaiApiKey)
    throw new ConfigError('Reporting agent requires OPENAI_API_KEY');

  const missing: string[] = [];
  if (!reddit.REDDIT_URL) missing.push('REDDIT_URL');
  if (!reddit.REDDIT_CLIENT_ID) missing.push('REDDIT_CLIENT_ID');
  if (!reddit.REDDIT_CLIENT_SECRET) missing.push('REDDIT_CLIENT_SECRET');
  if (!reddit.REDDIT_USERNAME) missing.push('REDDIT_USERNAME');
  if (!reddit.REDDIT_PASSWORD) missing.push('REDDIT_PASSWORD');

  if (missing.length)
    throw new ConfigError(`Missing Reddit credentials: ${missing.join(', ')}`);

  return {
    port: core.PORT ?? 3000,
    databaseUrl: core.DATABASE_URL,
    openaiApiKey,
    reddit: {
      url: reddit.REDDIT_URL!,
      clientId: reddit.REDDIT_CLIENT_ID!,
      clientSecret: reddit.REDDIT_CLIENT_SECRET!,
      username: reddit.REDDIT_USERNAME!,
      password: reddit.REDDIT_PASSWORD!,
    },
    llmProvider: llm.LLM_PROVIDER,
  };
}
