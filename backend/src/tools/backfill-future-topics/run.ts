import { z } from 'zod';
import type { LoggerPort } from '../../application/ports/output/LoggerPort';
import { NodeFetchAdapter } from '../../infrastructure/fetch/NodeFetchAdapter';
import {
  buildRedditHeaders,
  createRedditBackoff,
} from '../../infrastructure/items/RedditItemsAdapter';
import {
  getRedditAccessToken as getSharedRedditAccessToken,
  type RedditCredentials,
} from '../../infrastructure/items/redditAuth';
import { ConsoleLoggerAdapter } from '../../infrastructure/logging/ConsoleLoggerAdapter';
import { sleep } from '../../lib/async/sleep';
import { fetchWithRetry } from '../../lib/http/fetchWithRetry';
import { nowIso } from '../../lib/time/nowIso';
import { loadConfig } from './config';
import { makeDb } from './deps';
import type { RedditBackfillConfig, RedditBackfillPostRow } from './types';

const NullableString = z
  .string()
  .nullable()
  .optional()
  .transform((v) => v ?? '');
const NullableBoolean = z
  .boolean()
  .nullable()
  .optional()
  .transform((v) => v ?? false);
const NullableNumber = z
  .number()
  .nullable()
  .optional()
  .transform((v) => (typeof v === 'number' ? v : null));
const NullableInt = z
  .number()
  .nullable()
  .optional()
  .transform((v) => (typeof v === 'number' ? v : 0));

const RedditTopChildSchema = z
  .object({
    kind: z.string().optional(),
    data: z
      .object({
        id: z.string(),
        subreddit: z.string(),
        name: NullableString,
        title: NullableString,
        author: NullableString,
        selftext: NullableString,
        permalink: NullableString,
        url: NullableString,
        domain: NullableString,
        score: NullableInt,
        created_utc: NullableNumber,
        num_comments: NullableInt,
        upvote_ratio: z.number().nullable().optional().default(null),
        over_18: NullableBoolean,
        is_self: NullableBoolean,
        is_video: NullableBoolean,
        link_flair_text: NullableString,
        link_flair_type: NullableString,
      })
      // Preserve unknown keys so we can store a raw, future-proof post payload.
      .passthrough(),
  })
  .passthrough();

const RedditTopResponseSchema = z.object({
  data: z.object({
    children: z.array(z.unknown()),
  }),
});

type TokenState = { token: string };

const BASE_REDDIT_BACKOFF_MS = 100;
const SUBREDDIT_MAX_ATTEMPTS = 2;
const SUBREDDIT_RETRY_DELAY_MS = 1_000;
const AUTH_MAX_ATTEMPTS = 2;

function toRedditCredentials(cfg: RedditBackfillConfig): RedditCredentials {
  return {
    clientId: cfg.redditClientId,
    clientSecret: cfg.redditClientSecret,
    username: cfg.redditUsername,
    password: cfg.redditPassword,
  };
}

async function fetchRedditAccessToken(
  cfg: RedditBackfillConfig,
  fetcher: NodeFetchAdapter,
  logger: LoggerPort,
): Promise<string> {
  return getSharedRedditAccessToken(fetcher, toRedditCredentials(cfg), logger);
}

type FetchFailureResult = Exclude<
  Awaited<ReturnType<typeof fetchWithRetry>>,
  { ok: true }
>;

function formatFetchFailure(result: FetchFailureResult) {
  return {
    code: result.code,
    status: result.status ?? null,
    retryable: result.retryable,
    retryAfterMs: result.retryAfterMs ?? null,
  };
}

function buildTopUrl(cfg: RedditBackfillConfig, subreddit: string): string {
  return `https://oauth.reddit.com/r/${encodeURIComponent(
    subreddit,
  )}/top.json?t=${encodeURIComponent(cfg.timeRange)}&limit=${String(cfg.limit)}`;
}

function summarizeFailures(
  failures: Array<{ subreddit: string; error: string }>,
): string {
  return failures
    .map((failure) => `${failure.subreddit}=${failure.error}`)
    .join('; ');
}

async function fetchTopJsonForSubreddit(
  cfg: RedditBackfillConfig,
  fetcher: NodeFetchAdapter,
  tokenState: TokenState,
  subreddit: string,
  logger: LoggerPort,
): Promise<unknown> {
  const url = buildTopUrl(cfg, subreddit);
  const computeDelay = createRedditBackoff(BASE_REDDIT_BACKOFF_MS);

  for (let authAttempt = 0; authAttempt < AUTH_MAX_ATTEMPTS; authAttempt++) {
    const result = await fetchWithRetry(
      fetcher,
      url,
      { headers: buildRedditHeaders(tokenState.token, cfg.userAgent) },
      { computeDelay },
    );

    if (result.ok) {
      return await result.res.json();
    }

    if (result.code === 'AUTH' && authAttempt === 0) {
      tokenState.token = await fetchRedditAccessToken(cfg, fetcher, logger);
      continue;
    }

    throw new Error(
      `[${subreddit}] Reddit fetch failed: ${JSON.stringify(formatFetchFailure(result))}`,
    );
  }

  throw new Error(`[${subreddit}] Reddit fetch failed after token refresh`);
}

function mapChildToPostRow(
  fetchedAt: string,
  fetchedDay: string,
  child: z.infer<typeof RedditTopChildSchema>,
): RedditBackfillPostRow {
  const d = child.data;
  const subreddit = d.subreddit.toLowerCase();
  const domain = d.domain.trim() === '' ? 'unknown' : d.domain;
  const permalink =
    d.permalink && d.permalink.startsWith('http')
      ? d.permalink
      : d.permalink
        ? `https://reddit.com${d.permalink}`
        : `https://reddit.com/comments/${d.id}`;
  return {
    fetchedDay,
    fetchedAt,
    subreddit,
    redditId: d.id,
    author: d.author,
    postName: d.name || null,
    permalink,
    title: d.title,
    selftext: d.selftext,
    url: d.url,
    domain,
    createdUtc: typeof d.created_utc === 'number' ? d.created_utc : null,
    score: d.score,
    numComments: d.num_comments,
    upvoteRatio: d.upvote_ratio,
    over18: d.over_18,
    isSelf: d.is_self,
    isVideo: d.is_video,
    linkFlairText: d.link_flair_text,
    linkFlairType: d.link_flair_type,
  };
}

async function ensureSchema(sql: ReturnType<typeof makeDb>) {
  await sql`
    CREATE TABLE IF NOT EXISTS backfill_future_topics_reddit_posts (
      fetched_day date NOT NULL,
      fetched_at timestamptz NOT NULL,
      subreddit text NOT NULL,
      reddit_id text NOT NULL,
      author text NOT NULL,
      post_name text NULL,
      permalink text NOT NULL,
      title text NOT NULL,
      selftext text NOT NULL,
      url text NOT NULL,
      domain text NOT NULL,
      created_utc double precision NULL,
      score integer NOT NULL,
      num_comments integer NOT NULL,
      upvote_ratio real NULL,
      over_18 boolean NOT NULL,
      is_self boolean NOT NULL,
      is_video boolean NOT NULL,
      link_flair_text text NOT NULL,
      link_flair_type text NOT NULL,
      PRIMARY KEY (fetched_day, subreddit, reddit_id)
    );
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS backfill_future_topics_reddit_posts_fetched_at
    ON backfill_future_topics_reddit_posts (fetched_at);
  `;
}

async function upsertPosts(
  sql: ReturnType<typeof makeDb>,
  rows: RedditBackfillPostRow[],
) {
  let written = 0;
  let inserted = 0;

  for (const row of rows) {
    const result = (await (sql<{ inserted: boolean }[]>`
      INSERT INTO backfill_future_topics_reddit_posts (
        fetched_day, fetched_at, subreddit, reddit_id, author, post_name,
        permalink, title, selftext, url, domain, created_utc, score,
        num_comments, upvote_ratio, over_18, is_self, is_video, link_flair_text,
        link_flair_type
      )
      VALUES (
        ${row.fetchedDay}::date,
        ${row.fetchedAt}::timestamptz,
        ${row.subreddit}::text,
        ${row.redditId}::text,
        ${row.author}::text,
        ${row.postName}::text,
        ${row.permalink}::text,
        ${row.title}::text,
        ${row.selftext}::text,
        ${row.url}::text,
        ${row.domain}::text,
        ${row.createdUtc}::double precision,
        ${row.score}::int,
        ${row.numComments}::int,
        ${row.upvoteRatio}::real,
        ${row.over18}::boolean,
        ${row.isSelf}::boolean,
        ${row.isVideo}::boolean,
        ${row.linkFlairText}::text,
        ${row.linkFlairType}::text
      )
      ON CONFLICT (fetched_day, subreddit, reddit_id)
      DO UPDATE SET
        fetched_at = EXCLUDED.fetched_at,
        author = EXCLUDED.author,
        post_name = EXCLUDED.post_name,
        permalink = EXCLUDED.permalink,
        title = EXCLUDED.title,
        selftext = EXCLUDED.selftext,
        url = EXCLUDED.url,
        domain = EXCLUDED.domain,
        created_utc = EXCLUDED.created_utc,
        score = EXCLUDED.score,
        num_comments = EXCLUDED.num_comments,
        upvote_ratio = EXCLUDED.upvote_ratio,
        over_18 = EXCLUDED.over_18,
        is_self = EXCLUDED.is_self,
        is_video = EXCLUDED.is_video,
        link_flair_text = EXCLUDED.link_flair_text,
        link_flair_type = EXCLUDED.link_flair_type
      RETURNING (xmax = 0) AS inserted;
    ` as unknown as Promise<Array<{ inserted: boolean }>>)) as Array<{
      inserted: boolean;
    }>;
    written += 1;
    if (result[0]?.inserted) inserted += 1;
  }

  return { written, inserted, updated: written - inserted };
}

async function backfillSubreddit(
  cfg: RedditBackfillConfig,
  fetcher: NodeFetchAdapter,
  tokenState: TokenState,
  subreddit: string,
  fetchedAt: string,
  fetchedDay: string,
  logger: LoggerPort,
): Promise<{
  posts: RedditBackfillPostRow[];
}> {
  const json = await fetchTopJsonForSubreddit(
    cfg,
    fetcher,
    tokenState,
    subreddit,
    logger,
  );
  const parsed = RedditTopResponseSchema.safeParse(json);
  if (!parsed.success) {
    console.error(`[${subreddit}] invalid JSON`, parsed.error.flatten());
    return { posts: [] };
  }

  let invalidPosts = 0;
  const posts: RedditBackfillPostRow[] = [];
  for (const child of parsed.data.data.children) {
    const parsedChild = RedditTopChildSchema.safeParse(child);
    if (!parsedChild.success) {
      invalidPosts += 1;
      continue;
    }
    const row = mapChildToPostRow(fetchedAt, fetchedDay, parsedChild.data);
    if (row.score < cfg.minScore) continue;
    posts.push(row);
  }
  if (invalidPosts > 0) {
    console.warn(`[${subreddit}] skipped invalid post(s)`, { invalidPosts });
  }
  return { posts };
}

async function processSubreddit(
  cfg: RedditBackfillConfig,
  sql: ReturnType<typeof makeDb>,
  fetcher: NodeFetchAdapter,
  tokenState: TokenState,
  subreddit: string,
  fetchedAt: string,
  fetchedDay: string,
  logger: LoggerPort,
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= SUBREDDIT_MAX_ATTEMPTS; attempt++) {
    try {
      const result = await backfillSubreddit(
        cfg,
        fetcher,
        tokenState,
        subreddit,
        fetchedAt,
        fetchedDay,
        logger,
      );
      const postStats = await upsertPosts(sql, result.posts);
      return {
        rows: result.posts,
        ...postStats,
        attempts: attempt,
      };
    } catch (err) {
      lastError = err;
      if (attempt < SUBREDDIT_MAX_ATTEMPTS) {
        console.error(`[${subreddit}] attempt ${String(attempt)} failed`, err);
        await sleep(SUBREDDIT_RETRY_DELAY_MS);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Subreddit backfill failed');
}

export async function runBackfillFutureTopics() {
  const cfg = loadConfig();
  const sql = makeDb(cfg.databaseUrl);
  const fetcher = new NodeFetchAdapter(fetch);
  const tokenState: TokenState = { token: '' };
  const logger = new ConsoleLoggerAdapter(
    { level: 'info', pretty: true },
    { module: 'tools.backfill-future-topics' },
  );

  try {
    await ensureSchema(sql);
    const fetchedAt = nowIso();
    const fetchedDay = fetchedAt.slice(0, 10);

    console.log('Backfill start', {
      fetchedAt,
      fetchedDay,
      subreddits: cfg.subreddits.length,
      timeRange: cfg.timeRange,
      limit: cfg.limit,
      minScore: cfg.minScore,
    });

    tokenState.token = await fetchRedditAccessToken(cfg, fetcher, logger);

    let totalRows = 0;
    let totalWritten = 0;
    let totalInserted = 0;
    let totalUpdated = 0;
    const failures: Array<{ subreddit: string; error: string }> = [];

    for (const subreddit of cfg.subreddits) {
      try {
        const result = await processSubreddit(
          cfg,
          sql,
          fetcher,
          tokenState,
          subreddit,
          fetchedAt,
          fetchedDay,
          logger,
        );
        totalRows += result.rows.length;
        totalWritten += result.written;
        totalInserted += result.inserted;
        totalUpdated += result.updated;
        console.log(`[${subreddit}]`, {
          rows: result.rows.length,
          written: result.written,
          inserted: result.inserted,
          updated: result.updated,
          attempts: result.attempts,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        failures.push({ subreddit, error: message });
        console.error(`[${subreddit}] failed after retries`, err);
      }
      await sleep(cfg.sleepMs);
    }

    console.log('Backfill done', {
      fetchedAt,
      fetchedDay,
      totalRows,
      totalWritten,
      totalInserted,
      totalUpdated,
      failedSubreddits: failures.length,
    });

    if (failures.length > 0) {
      throw new Error(
        `Backfill completed with ${String(failures.length)} subreddit failure(s): ${summarizeFailures(
          failures,
        )}`,
      );
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}
