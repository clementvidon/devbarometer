import { z } from 'zod';

export interface DataPoint {
  upvotes: number;
  title: string;
  content: string;
  topComment: string | null;
}

const BASE_URL = 'https://www.reddit.com';
const USER_AGENT = 'devbarometer/0.1 by clementvidon';

const RedditPostDataSchema = z.object({
  id: z.string(),
  title: z.string(),
  selftext: z.string(),
  ups: z.number(),
});

const RedditPostWrapperSchema = z.object({
  data: RedditPostDataSchema,
});

const RedditAPIResponseSchema = z.object({
  data: z.object({
    children: z.array(RedditPostWrapperSchema),
  }),
});

type RedditPostData = z.infer<typeof RedditPostDataSchema>;
type RedditPostWrapper = z.infer<typeof RedditPostWrapperSchema>;

async function fetchAllPosts(
  subreddit: string,
  limit: number,
  timeRange: string,
): Promise<RedditPostWrapper[]> {
  const res = await fetch(
    `${BASE_URL}/r/${subreddit}/top.json?limit=${limit}&t=${timeRange}`,
    { headers: { 'User-Agent': USER_AGENT } },
  );
  const json = await res.json();
  const result = RedditAPIResponseSchema.safeParse(json);

  if (!result.success) {
    console.error('Reddit API response invalid:', result.error.flatten());
    return [];
  }

  return result.data.data.children;
}

function filterPosts(
  posts: RedditPostWrapper[],
  minUpvotes: number,
): RedditPostWrapper[] {
  return posts.filter(({ data }) => data.ups >= minUpvotes);
}

async function fetchTopComment(
  subreddit: string,
  postId: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/r/${subreddit}/comments/${postId}.json?limit=1`,
      { headers: { 'User-Agent': USER_AGENT } },
    );
    const json = await res.json();
    return json?.[1]?.data?.children?.[0]?.data?.body ?? null;
  } catch (err) {
    console.error(`Failed to fetch top comment for post ${postId}:`, err);
    return null;
  }
}

function sanitizeString(input: string): string {
  return input.replace(/\n+/g, ' ').trim();
}

function buildDataPoint(
  post: RedditPostData,
  topComment: string | null,
): DataPoint {
  return {
    upvotes: post.ups,
    title: sanitizeString(post.title),
    content: sanitizeString(post.selftext),
    topComment: topComment ? sanitizeString(topComment) : null,
  };
}

export async function getRedditDataPoints(
  subreddit: string,
  limit: number,
  timeRange: string,
): Promise<DataPoint[]> {
  try {
    const allPosts = await fetchAllPosts(subreddit, limit, timeRange);
    const filteredPosts = filterPosts(allPosts, 10);

    const dataPoints = await Promise.all(
      filteredPosts.map(async ({ data }) => {
        const topComment = await fetchTopComment(subreddit, data.id);
        return buildDataPoint(data, topComment);
      }),
    );

    return dataPoints;
  } catch (err) {
    throw new Error(`Failed to fetch Reddit posts: ${err}`);
  }
}
