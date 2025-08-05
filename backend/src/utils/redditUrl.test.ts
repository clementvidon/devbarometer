import { describe, expect, test } from 'vitest';
import { makeRedditTopUrl } from './redditUrl.ts';

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
