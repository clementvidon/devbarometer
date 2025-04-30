import { describe, test, expect } from 'vitest';
import { makeRedditTopUrl, makeRedditCommentsUrl } from './redditUrl';

const BASE = 'https://www.reddit.com';

describe('makeRedditTopUrl', () => {
  test('builds a top-posts URL with given limit and period', () => {
    const url = makeRedditTopUrl('javascript', 5, 'day');
    expect(url).toBe(`${BASE}/r/javascript/top.json?limit=5&t=day`);
  });

  test('handles subreddits with special characters', () => {
    const url = makeRedditTopUrl('reactjs_test', 10, 'week');
    expect(url).toBe(`${BASE}/r/reactjs_test/top.json?limit=10&t=week`);
  });
});

describe('makeRedditCommentsUrl', () => {
  test('builds a comments URL with explicit limit', () => {
    const url = makeRedditCommentsUrl('vuejs', 'abc123', 3);
    expect(url).toBe(`${BASE}/r/vuejs/comments/abc123.json?limit=3`);
  });

  test('defaults limit to 1 when not provided', () => {
    const url = makeRedditCommentsUrl('node', 'xyz789');
    expect(url).toBe(`${BASE}/r/node/comments/xyz789.json?limit=1`);
  });

  test('handles numeric-looking subreddit names and IDs', () => {
    expect(makeRedditCommentsUrl('123', '456')).toBe(
      `${BASE}/r/123/comments/456.json?limit=1`,
    );
  });
});
