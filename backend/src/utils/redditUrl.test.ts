import { describe, expect, test } from 'vitest';
import { makeRedditCommentsUrl, makeRedditTopUrl } from './redditUrl.ts';

const BASE = 'https://old.reddit.com';

describe('makeRedditTopUrl', () => {
  test('builds a top-posts URL with given limit and period', () => {
    const url = makeRedditTopUrl('javascript', 5, 'day');
    expect(url).toBe(`${BASE}/r/javascript/top.json?limit=5&t=day&raw_json=1`);
  });

  test('handles subreddits with special characters', () => {
    const url = makeRedditTopUrl('reactjs_test', 10, 'week');
    expect(url).toBe(
      `${BASE}/r/reactjs_test/top.json?limit=10&t=week&raw_json=1`,
    );
  });
});

describe('makeRedditCommentsUrl', () => {
  test('builds a comments URL with explicit limit', () => {
    const url = makeRedditCommentsUrl('vuejs', 'abc123', 3);
    expect(url).toBe(`${BASE}/r/vuejs/comments/abc123.json?limit=3&raw_json=1`);
  });

  test('defaults limit to 1 when not provided', () => {
    const url = makeRedditCommentsUrl('node', 'xyz789');
    expect(url).toBe(`${BASE}/r/node/comments/xyz789.json?limit=1&raw_json=1`);
  });

  test('handles numeric-looking subreddit names and IDs', () => {
    expect(makeRedditCommentsUrl('123', '456')).toBe(
      `${BASE}/r/123/comments/456.json?limit=1&raw_json=1`,
    );
  });
});
