import { z } from 'zod';
import type { LogLevel } from '../../application/ports/output/LoggerPort';
import {
  CoreEnvSchema,
  GlobalEnvSchema,
  LlmEnvSchema,
  LoggingEnvSchema,
  RedditEnvSchema,
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

/* ---------- global ---------- */

export type NodeEnv = z.infer<typeof GlobalEnvSchema>['NODE_ENV'];

export type GlobalConfig = {
  appName: string;
  appVersion: string;
  nodeEnv: NodeEnv;
};

export function loadGlobalConfig(env: Env = process.env): GlobalConfig {
  const globalEnv = parseEnv(GlobalEnvSchema, env);
  const nodeEnv = globalEnv.NODE_ENV;
  return {
    appName: globalEnv.APP_NAME,
    appVersion: globalEnv.APP_VERSION,
    nodeEnv,
  };
}
/* ---------- core ---------- */

export type CoreConfig = {
  port: number;
  databaseUrl: string;
};

export function loadCoreConfig(env: Env = process.env): CoreConfig {
  const core = parseEnv(CoreEnvSchema, env);
  const port = core.PORT;
  return { port, databaseUrl: core.DATABASE_URL };
}

/* ---------- logging ---------- */

export type LoggingConfig = {
  level: LogLevel;
  pretty: boolean;
};

export function loadLoggingConfig(env: Env = process.env): LoggingConfig {
  const logging = parseEnv(LoggingEnvSchema, env);
  const { nodeEnv } = loadGlobalConfig(env);
  const pretty = logging.LOG_PRETTY ?? nodeEnv !== 'production';
  const level = (logging.LOG_LEVEL ?? (pretty ? 'debug' : 'info')) as LogLevel;
  return { level, pretty };
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

  if (!llm.OPENAI_API_KEY) {
    throw new ConfigError(
      'OPENAI_API_KEY is required for this reporting agent configuration',
    );
  }

  if (
    !reddit.REDDIT_URL ||
    !reddit.REDDIT_CLIENT_ID ||
    !reddit.REDDIT_CLIENT_SECRET ||
    !reddit.REDDIT_USERNAME ||
    !reddit.REDDIT_PASSWORD
  ) {
    throw new ConfigError(
      'All Reddit credentials are required for this reporting agent configuration',
    );
  }

  return {
    port: core.PORT,
    databaseUrl: core.DATABASE_URL,
    openaiApiKey: llm.OPENAI_API_KEY,
    reddit: {
      url: reddit.REDDIT_URL,
      clientId: reddit.REDDIT_CLIENT_ID,
      clientSecret: reddit.REDDIT_CLIENT_SECRET,
      username: reddit.REDDIT_USERNAME,
      password: reddit.REDDIT_PASSWORD,
    },
    llmProvider: llm.LLM_PROVIDER,
  };
}
