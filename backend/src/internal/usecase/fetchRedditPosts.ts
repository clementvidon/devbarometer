import { z } from 'zod';
import { makeRedditTopUrl } from '../../utils/redditUrl.ts';
import type { Post } from '../core/entity/Post.ts';
import type { FetchPort } from '../core/port/FetchPort.ts';
import { PostChildSchema, PostsResponseSchema } from './RedditSchemas.ts';

const HEADERS = {
  'User-Agent': 'devbarometer/1.0 (by u/clem9nt contact: cvidon@student.42.fr)',
  Accept: 'application/json',
  'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
};

const MAX_RETRIES = 3;
const TIMEOUT_MS = 5000;
const MIN_UPVOTES = 10;

type APIResponsePostChild = z.infer<typeof PostChildSchema>;

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
          `[fetchWithRateLimit] URL: ${url}, Waiting ${backoff}ms before retry...`,
        );
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const html = await res.text();
        console.warn(
          `[fetchWithRateLimit] Non-JSON response at ${url} (status ${res.status}):\n${html.slice(0, 200)}...`,
        );
        return null;
      }

      const json: unknown = await res.json();
      return json;
    } catch (err) {
      console.error(
        `[fetchWithRateLimit] URL: ${url}, Attempt ${attempt + 1}:`,
        err,
      );
      const backoff = Math.pow(2, attempt) * 100;
      await new Promise((r) => setTimeout(r, backoff));
    }
  }

  console.error(
    `[fetchWithRateLimit] URL: ${url}, after ${MAX_RETRIES} attempts.`,
  );
  return null;
}

async function fetchAllPosts(
  fetcher: FetchPort,
  subreddit: string,
  limit: number,
  period: string,
): Promise<APIResponsePostChild[]> {
  const url = makeRedditTopUrl(subreddit, limit, period);
  const json = await fetchWithRateLimit(fetcher, url, { headers: HEADERS });

  if (json == null) return [];

  const parsed = PostsResponseSchema.safeParse(json);
  if (!parsed.success) {
    console.error(
      `[fetchAllPosts] URL: ${url}, Errors:`,
      parsed.error.flatten(),
    );
    return [];
  }
  return parsed.data.data.children;
}

const sanitize = (s: string) => s.replace(/\s+/g, ' ').trim();

export async function fetchRedditPosts(
  fetcher: FetchPort,
  subreddit: string,
  limit: number,
  period: string,
): Promise<Post[]> {
  const postChildren = await fetchAllPosts(fetcher, subreddit, limit, period);
  if (postChildren.length === 0) {
    console.error(
      `[fetchRedditPosts] No posts found for subreddit "${subreddit}".`,
    );
    return [];
  }

  const filtered = postChildren.filter((w) => w.data.ups >= MIN_UPVOTES);
  if (filtered.length === 0) {
    console.error(
      `[fetchRedditPosts] No posts with enough upvotes found (min ${MIN_UPVOTES}).`,
    );
    return [];
  }

  const posts: Post[] = filtered.map(({ data }) => ({
    id: data.id,
    upvotes: data.ups,
    title: sanitize(data.title),
    content: sanitize(data.selftext),
  }));

  return posts;
}
