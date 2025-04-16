interface DataPoint {
  upvotes: number;
  title: string;
  content: string;
  topComment: string | null;
}

interface RedditPostData {
  id: string;
  title: string;
  selftext: string;
  ups: number;
}

interface RedditPostWrapper {
  data: RedditPostData;
}

interface RedditAPIResponse {
  data: {
    children: RedditPostWrapper[];
  };
}

const BASE_URL = 'https://www.reddit.com';

async function fetchAllPosts(
  subreddit: string,
  limit: number,
  timeRange: string,
): Promise<RedditPostWrapper[]> {
  const res = await fetch(
    `${BASE_URL}/r/${subreddit}/top.json?limit=${limit}&t=${timeRange}`,
    { headers: { 'User-Agent': 'devbarometer/0.1 by clementvidon' } },
  );
  const json: RedditAPIResponse = await res.json();
  return json?.data?.children ?? [];
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
      { headers: { 'User-Agent': 'devbarometer/0.1 by clem' } },
    );
    const json = await res.json();
    return json?.[1]?.data?.children?.[0]?.data?.body ?? null;
  } catch {
    return null;
  }
}

function sanitizeString(input: string): string {
  return input.replace(/\n+/g, ' ');
}

function buildDataPoint(
  post: RedditPostData,
  topComment: string | null,
): DataPoint {
  return {
    upvotes: post.ups ?? 0,
    title: sanitizeString(post.title),
    content: sanitizeString(post.selftext ?? ''),
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
    const dataPoints: DataPoint[] = [];
    for (const { data } of filteredPosts) {
      const topComment = await fetchTopComment(subreddit, data.id);
      const dataPoint = buildDataPoint(data, topComment);
      dataPoints.push(dataPoint);
    }
    return dataPoints;
  } catch (err) {
    throw new Error(`Failed to fetch Reddit posts: ${err}`);
  }
}
