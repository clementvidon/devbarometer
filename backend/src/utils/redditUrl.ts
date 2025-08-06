const BASE_URL = 'https://old.reddit.com';

/**
 * Get the top posts of a sub – /r/{sub}/top.json
 */
export function makeRedditTopUrl(
  subreddit: string,
  limit: number,
  period: string,
): string {
  return `${BASE_URL}/r/${subreddit}/top.json?limit=${limit}&t=${period}&raw_json=1`;
}
