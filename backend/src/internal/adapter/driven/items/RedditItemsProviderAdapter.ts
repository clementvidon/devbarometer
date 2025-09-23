import { z } from 'zod';
import { getRedditAccessToken } from '../../../../utils/redditAuth.ts';
import type { Item } from '../../../core/entity/Item.ts';
import type { FetchPort } from '../../../core/port/FetchPort.ts';
import type { ItemsProviderPort } from '../../../core/port/ItemsProviderPort.ts';
import { fetchWithRetry } from '../../../lib/http/fetchWithRetry.ts';
import { filterByScore } from '../../../usecase/items/filterByScore.ts';
import { normalizeWhitespace } from '../../../usecase/items/normalizeWhitespace.ts';

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

export interface RedditItemsProviderOptions {
  /** Minimum threshold of upvotes to keep the item (default: 5) */
  minScore: number;
  /** User-Agent suffix to send to Reddit (default: devbarometer UA) */
  userAgentSuffix: string;
  /** Base backoff in milliseconds used by exponential backoff (default: 100) */
  baseBackoffMs: number;
}

const DEFAULT_REDDIT_ITEMS_PROVIDER_OPTIONS = {
  minScore: 5,
  userAgentSuffix:
    'devbarometer/1.0 (https://github.com/clementvidon/devbarometer by u/clem9nt)',
  baseBackoffMs: 100,
} as const satisfies RedditItemsProviderOptions;

function mergeRedditItemsProviderOptions(
  opts: Partial<RedditItemsProviderOptions> = {},
): RedditItemsProviderOptions {
  return { ...DEFAULT_REDDIT_ITEMS_PROVIDER_OPTIONS, ...opts };
}

function mapRedditChildToItem(child: z.infer<typeof RedditChildSchema>): Item {
  const d = child.data;
  return {
    source: `https://reddit.com/comments/${d.id}`,
    title: normalizeWhitespace(d.title),
    content: normalizeWhitespace(d.selftext ?? ''),
    score: d.ups ?? 0,
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
  fetcher: FetchPort,
  url: string,
  opts: Partial<RedditItemsProviderOptions> = {},
): Promise<Item[]> {
  const { minScore, userAgentSuffix, baseBackoffMs } =
    mergeRedditItemsProviderOptions(opts);
  let token: string;
  try {
    token = await getRedditAccessToken(fetcher);
  } catch (err) {
    console.error('[fetchRedditItems] failed to get reddit token:', err);
    return [];
  }
  const headers = buildRedditHeaders(token, userAgentSuffix);
  const computeDelay = createRedditBackoff(baseBackoffMs);
  const res = await fetchWithRetry(fetcher, url, { headers }, { computeDelay });

  if (res == null) return [];

  let json: unknown;
  try {
    json = await res.json();
  } catch (err) {
    console.error('[fetchRedditItems] failed to parse JSON response:', err);
    return [];
  }

  const parsed = ItemsResponseSchema.safeParse(json);
  if (!parsed.success) {
    console.error(
      `[fetchRedditItems] URL: ${url}, Errors:`,
      parsed.error.flatten(),
    );
    return [];
  }

  const children = parsed.data.data.children;
  const items: Item[] = children.map(mapRedditChildToItem);
  const filtered = filterByScore(items, minScore);
  return filtered;
}

export class RedditItemsProviderAdapter implements ItemsProviderPort {
  private readonly opts: RedditItemsProviderOptions;

  constructor(
    private readonly fetcher: FetchPort,
    private readonly url: string,
    opts: Partial<RedditItemsProviderOptions> = {},
  ) {
    this.opts = { ...DEFAULT_REDDIT_ITEMS_PROVIDER_OPTIONS, ...opts };
  }

  async getItems(): Promise<Item[]> {
    return fetchRedditItems(this.fetcher, this.url, this.opts);
  }

  getLabel(): string {
    return this.url;
  }

  getCreatedAt(): string | null {
    return null;
  }
}
