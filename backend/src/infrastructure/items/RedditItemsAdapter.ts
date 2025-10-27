import { z } from 'zod';
import type { FetchPort } from '../../application/ports/output/FetchPort';
import type { ItemsProviderPort } from '../../application/ports/output/ItemsProviderPort';
import type { LoggerPort } from '../../application/ports/output/LoggerPort';
import type { Item } from '../../domain/entities';
import { filterByScore } from '../../domain/services/items/filterByScore';
import { fetchWithRetry } from '../../lib/http/fetchWithRetry';
import { normalizeWhitespace } from '../../lib/string/normalizeWhitespace';
import { getRedditAccessToken, type RedditCredentials } from './redditAuth';

export const RedditChildSchema = z.object({
  data: z.object({
    id: z.string(),
    title: z.string(),
    selftext: z.string().optional().default(''),
    ups: z.number(),
  }),
});

export const ItemsResponseSchema = z.object({
  data: z.object({
    children: z.array(RedditChildSchema),
  }),
});

export interface RedditItemsOptions {
  /** Minimum threshold of upvotes to keep the item (default: 5) */
  minScore: number;
  /** User-Agent suffix to send to Reddit (default: devbarometer UA) */
  userAgentSuffix: string;
  /** Base backoff in milliseconds used by exponential backoff (default: 100) */
  baseBackoffMs: number;
}

const DEFAULT_REDDIT_ITEMS_OPTIONS = {
  minScore: 5,
  userAgentSuffix:
    'devbarometer/1.0 (https://github.com/clementvidon/devbarometer by u/clem9nt)',
  baseBackoffMs: 100,
} as const satisfies RedditItemsOptions;

function mergeRedditItemsOptions(
  opts: Partial<RedditItemsOptions> = {},
): RedditItemsOptions {
  return { ...DEFAULT_REDDIT_ITEMS_OPTIONS, ...opts };
}

function mapRedditChildToItem(child: z.infer<typeof RedditChildSchema>): Item {
  const d = child.data;
  return {
    source: `https://reddit.com/comments/${d.id}`,
    title: normalizeWhitespace(d.title),
    content: normalizeWhitespace(d.selftext),
    score: d.ups,
  };
}

export function createRedditBackoff(baseBackoffMs: number) {
  return function redditBackoffMs(attempt: number, res?: Response): number {
    if (res?.status === 429) {
      const raw = res.headers.get('X-Ratelimit-Reset');
      const resetSec = raw ? Number(raw) : NaN;
      if (Number.isFinite(resetSec) && resetSec > 0) {
        return Math.max(baseBackoffMs, Math.pow(2, attempt) * resetSec * 1000);
      }
    }
    return Math.pow(2, attempt) * baseBackoffMs;
  };
}

export function buildRedditHeaders(
  token: string,
  userAgentSuffix: string,
): Record<string, string> {
  return {
    'User-Agent': userAgentSuffix,
    Accept: 'application/json',
    'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchRedditItems(
  logger: LoggerPort,
  fetcher: FetchPort,
  url: string,
  creds: RedditCredentials,
  opts: RedditItemsOptions,
): Promise<Item[]> {
  const { minScore, userAgentSuffix, baseBackoffMs } = opts;
  let token: string;
  try {
    token = await getRedditAccessToken(fetcher, creds, logger);
  } catch (err) {
    logger.error('Failed to get Reddit token', { error: err });
    return [];
  }
  const headers = buildRedditHeaders(token, userAgentSuffix);
  const computeDelay = createRedditBackoff(baseBackoffMs);
  const result = await fetchWithRetry(
    fetcher,
    url,
    { headers },
    { computeDelay },
    logger,
  );

  if (!result.ok) {
    logger.error('Reddit fetch failed', {
      code: result.code,
      status: result.status ?? null,
      retryAfterMs: result.retryAfterMs ?? null,
      error: result.error ?? null,
    });
    return [];
  }
  const res = result.res;

  let json: unknown;
  try {
    json = await res.json();
  } catch (err) {
    logger.error('Failed to parse Reddit JSON response', { error: err });
    return [];
  }

  const parsed = ItemsResponseSchema.safeParse(json);
  if (!parsed.success) {
    logger.error('Invalid Reddit items JSON', {
      url,
      errors: parsed.error.format(),
    });
    return [];
  }

  const children = parsed.data.data.children;
  const items: Item[] = children.map(mapRedditChildToItem);
  const filtered = filterByScore(items, minScore);
  return filtered;
}

export class RedditItemsAdapter implements ItemsProviderPort {
  private readonly opts: RedditItemsOptions;
  private readonly logger: LoggerPort;

  constructor(
    logger: LoggerPort,
    private readonly fetcher: FetchPort,
    private readonly url: string,
    private readonly creds: RedditCredentials,
    opts: Partial<RedditItemsOptions> = {},
  ) {
    this.logger = logger.child({ module: 'items.reddit' });
    this.opts = mergeRedditItemsOptions(opts);
  }

  async getItems(): Promise<Item[]> {
    return fetchRedditItems(
      this.logger,
      this.fetcher,
      this.url,
      this.creds,
      this.opts,
    );
  }

  getLabel(): string {
    return this.url;
  }

  getCreatedAt(): string | null {
    return null;
  }
}
