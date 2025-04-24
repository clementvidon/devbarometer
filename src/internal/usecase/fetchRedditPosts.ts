import { z } from 'zod';
import type { FetchPort } from '../core/port/FetchPort';
import type { Post } from '../core/entity/Post';
import {
  PostSchema,
  PostChildSchema,
  PostsResponseSchema,
  CommentsResponseSchema,
} from './RedditSchemas';

const BASE_URL = 'https://www.reddit.com';
const USER_AGENT = 'devbarometer/0.1 by clementvidon';
const HEADERS = { 'User-Agent': USER_AGENT };

const MAX_RETRIES = 3;
const TIMEOUT_MS = 5000;

const MIN_UPVOTES = 10;

type APIResponsePost = z.infer<typeof PostSchema>;
type APIResponsePostChild = z.infer<typeof PostChildSchema>;

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), ms),
  );
  return Promise.race([promise, timeout]);
}

async function fetchWithRateLimit<T>(
  fetcher: FetchPort,
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES,
): Promise<T | null> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await withTimeout(fetcher.fetch(url, options), TIMEOUT_MS);

      if (res.status === 429) {
        const reset = parseFloat(res.headers.get('X-Ratelimit-Reset') ?? '1');
        const backoff = Math.pow(2, attempt) * reset * 1000;
        console.warn(
          `[Rate Limit] URL: ${url}, Waiting ${backoff}ms before retry...`,
        );
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }

      const json = await res.json();
      return json;
    } catch (err) {
      console.error(`[Fetch Error] URL: ${url}, Attempt ${attempt + 1}:`, err);
      const backoff = Math.pow(2, attempt) * 100;
      await new Promise((r) => setTimeout(r, backoff));
    }
  }

  console.error(`[Fetch Failed] URL: ${url}, after ${MAX_RETRIES} attempts.`);
  return null;
}

async function fetchAllPosts(
  fetcher: FetchPort,
  subreddit: string,
  limit: number,
  timeRange: string,
): Promise<APIResponsePostChild[]> {
  const url = `${BASE_URL}/r/${subreddit}/top.json?limit=${limit}&t=${timeRange}`;
  const json = await fetchWithRateLimit<unknown>(fetcher, url, {
    headers: HEADERS,
  });

  if (json == null) {
    return [];
  }

  const parsed = PostsResponseSchema.safeParse(json);
  if (!parsed.success) {
    console.error(
      `[Invalid Post JSON] URL: ${url}, Errors:`,
      parsed.error.flatten(),
    );
    return [];
  }

  return parsed.data.data.children;
}

async function fetchTopComment(
  fetcher: FetchPort,
  subreddit: string,
  postId: string,
): Promise<string | null> {
  const url = `${BASE_URL}/r/${subreddit}/comments/${postId}.json?limit=1`;
  const json = await fetchWithRateLimit<unknown>(fetcher, url, {
    headers: HEADERS,
  });

  if (json == null) {
    return null;
  }

  const parsed = CommentsResponseSchema.safeParse(json);
  if (!parsed.success) {
    console.error(
      `[Invalid Comment JSON] URL: ${url}, Errors:`,
      parsed.error.flatten(),
    );
    return null;
  }

  return parsed.data[1]?.data?.children?.[0]?.data?.body ?? null;
}

const sanitize = (s: string) => s.replace(/\s+/g, ' ').trim();

function buildPost(post: APIResponsePost, comment: string | null): Post {
  return {
    id: post.id,
    upvotes: post.ups,
    title: sanitize(post.title),
    content: sanitize(post.selftext),
    topComment: comment != null && comment !== '' ? sanitize(comment) : null,
  };
}

export async function fetchRedditPosts(
  fetcher: FetchPort,
  subreddit: string,
  limit: number,
  timeRange: string,
): Promise<Post[]> {
  const postChildren = await fetchAllPosts(
    fetcher,
    subreddit,
    limit,
    timeRange,
  );
  const filtered = postChildren.filter((w) => w.data.ups >= MIN_UPVOTES);
  const posts = await Promise.all(
    filtered.map(async ({ data }) => {
      const comment = await fetchTopComment(fetcher, subreddit, data.id);
      return buildPost(data, comment);
    }),
  );
  return posts;
}
