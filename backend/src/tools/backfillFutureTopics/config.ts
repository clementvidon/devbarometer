/**
 * TEMP SCRIPT
 * Backfills future topics.
 * Can violate hexagonal boundaries.
 * Do not reuse in production code.
 */

import { z } from 'zod';
import { parseEnv } from '../../infrastructure/config/loaders';
import { DEFAULT_REDDIT_USER_AGENT } from '../../infrastructure/items/redditAuth';
import type { RedditBackfillConfig } from './types';

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDDIT_CLIENT_ID: z.string().min(1),
  REDDIT_CLIENT_SECRET: z.string().min(1),
  REDDIT_USERNAME: z.string().min(1),
  REDDIT_PASSWORD: z.string().min(1),
});

const TOOL_CONFIG = {
  subreddits: [
    'africa',
    'bitcoin',
    'cryptocurrency',
    'cryptomarkets',
    'cryptomoonshots',
    'solana',
    'defi',
    'ethtrader',
    'technology',
    'artificial',
    'openai',
    'anthropic',
    'chatgptcoding',
    'claudecode',
    'claudeai',
    'chatgpt',
    'layoffs',
    'remotejobs',
    'remotework',
    'cscareerquestions',
    'itcareerquestions',
    'h1b',
    'electriccars',
    'electricvehicles',
    'evcharging',
    'etudiants',
    'developpeurs',
    'southafrica',
    'paris',
    'france',
  ],
  timeRange: 'week',
  limit: 100,
  minScore: 10,
  sleepMs: 500,
  userAgent: DEFAULT_REDDIT_USER_AGENT,
} as const satisfies Pick<
  RedditBackfillConfig,
  'subreddits' | 'timeRange' | 'limit' | 'minScore' | 'sleepMs' | 'userAgent'
>;

function loadToolConfig() {
  return {
    ...TOOL_CONFIG,
    subreddits: [...TOOL_CONFIG.subreddits],
  };
}

export function loadConfig(
  env: Record<string, string | undefined> = process.env,
): RedditBackfillConfig {
  const e = parseEnv(EnvSchema, env);
  const tool = loadToolConfig();
  return {
    databaseUrl: e.DATABASE_URL,
    redditClientId: e.REDDIT_CLIENT_ID,
    redditClientSecret: e.REDDIT_CLIENT_SECRET,
    redditUsername: e.REDDIT_USERNAME,
    redditPassword: e.REDDIT_PASSWORD,
    subreddits: tool.subreddits,
    timeRange: tool.timeRange,
    limit: tool.limit,
    minScore: tool.minScore,
    sleepMs: tool.sleepMs,
    userAgent: tool.userAgent,
  };
}
