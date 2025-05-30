const BASE_URL = 'https://www.reddit.com';

/**
 * Get the top posts of a sub – /r/{sub}/top.json
 */
export function makeRedditTopUrl(
  subreddit: string,
  limit: number,
  period: string,
): string {
  return `${BASE_URL}/r/${subreddit}/top.json?limit=${limit}&t=${period}`;
}

/**
 * Get the 1st comment of a post – /r/{sub}/comments/{id}.json
 */
export function makeRedditCommentsUrl(
  subreddit: string,
  postId: string,
  limit = 1,
): string {
  return `${BASE_URL}/r/${subreddit}/comments/${postId}.json?limit=${limit}`;
}
