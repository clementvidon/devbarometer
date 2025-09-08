import { z } from 'zod';
import { getRedditAccessToken } from '../../../../utils/redditAuth.ts';
import type { Item } from '../../../core/entity/Item.ts';
import type { FetchPort } from '../../../core/port/FetchPort.ts';
import type { ItemsProviderPort } from '../../../core/port/ItemsProviderPort.ts';

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

const BASE_HEADERS = {
  'User-Agent':
    'devbarometer/1.0 (https://github.com/clementvidon/devbarometer by u/clem9nt)',
  Accept: 'application/json',
  'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
};

const MAX_RETRIES = 3;
const TIMEOUT_MS = 5000;
const MIN_UPVOTES = 5;

const sanitize = (s: string) => s.replace(/\s+/g, ' ').trim();

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), ms),
  );
  return Promise.race([promise, timeout]);
}

async function fetchWithRateLimit(
  fetcher: FetchPort,
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES,
): Promise<unknown> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await withTimeout(fetcher.fetch(url, options), TIMEOUT_MS);

      if (res.status === 429) {
        const reset = parseFloat(res.headers.get('X-Ratelimit-Reset') ?? '1');
        const backoff = Math.pow(2, attempt) * reset * 1000;
        console.warn(
          `[fetchWithRateLimit] 429 Too Many Requests. Retrying in ${backoff}ms...`,
        );
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }

      if (res.status === 401) {
        console.error(
          `[fetchWithRateLimit] 401 Unauthorized – check Reddit credentials.`,
        );
        return null;
      }

      if (res.status === 403) {
        console.error(
          `[fetchWithRateLimit] 403 Forbidden – access denied for ${url}`,
        );
        return null;
      }

      if (res.status >= 500) {
        console.warn(
          `[fetchWithRateLimit] ${res.status} Server error. Retrying...`,
        );
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }

      if (res.status >= 400) {
        const msg = await res.text();
        console.error(
          `[fetchWithRateLimit] ${res.status} Error:\n${msg.slice(0, 300)}...`,
        );
        return null;
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const html = await res.text();
        console.warn(
          `[fetchWithRateLimit] Non-JSON response at ${url}:\n${html.slice(
            0,
            200,
          )}...`,
        );
        return null;
      }

      return await res.json();
    } catch (err) {
      console.error(
        `[fetchWithRateLimit] ${url}, attempt ${attempt + 1}:`,
        err,
      );
      const backoff = Math.pow(2, attempt) * 100;
      await new Promise((r) => setTimeout(r, backoff));
    }
  }

  console.error(
    `[fetchWithRateLimit] ${url}, failed after ${MAX_RETRIES} attempts.`,
  );
  return null;
}

export async function fetchRedditItems(
  fetcher: FetchPort,
  url: string,
): Promise<Item[]> {
  const token = await getRedditAccessToken(fetcher);
  const headers = {
    ...BASE_HEADERS,
    Authorization: `Bearer ${token}`,
  };

  const json = await fetchWithRateLimit(fetcher, url, { headers });
  if (json == null) return [];

  const parsed = ItemsResponseSchema.safeParse(json);
  if (!parsed.success) {
    console.error(
      `[fetchRedditItems] URL: ${url}, Errors:`,
      parsed.error.flatten(),
    );
    return [];
  }

  const children = parsed.data.data.children;
  const filtered = children.filter((w) => w.data.ups >= MIN_UPVOTES);

  return filtered.map(({ data }) => ({
    source: `https://reddit.com/comments/${data.id}`,
    title: sanitize(data.title),
    content: sanitize(data.selftext),
    weight: data.ups,
  }));
}

export class RedditItemsProviderAdapter implements ItemsProviderPort {
  constructor(
    private readonly fetcher: FetchPort,
    private readonly url: string,
  ) {}

  async getItems(): Promise<Item[]> {
    return fetchRedditItems(this.fetcher, this.url);
  }

  getLabel(): string {
    return this.url;
  }

  getCreatedAt(): string | null {
    return null;
  }
}
