import { describe, test, expect, vi, beforeEach } from 'vitest';
import { getRedditDataPoints } from '../../src/agent/getRedditDataPoints.ts';

const fakePosts = [
  {
    data: { id: 'aaa', title: 'First\nPost', selftext: 'Content\n1', ups: 15 },
  },
  { data: { id: 'bbb', title: 'Second Post', selftext: 'Content 2', ups: 5 } },
  { data: { id: 'ccc', title: 'Third Post', selftext: '', ups: 20 } },
];

describe('getRedditDataPoints', () => {
  describe('Happy path', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
      vi.stubGlobal(
        'fetch',
        vi.fn((url: string) => {
          if (url.includes('/top.json')) {
            return Promise.resolve({
              json: async () => ({ data: { children: fakePosts } }),
            });
          }
          if (url.includes('/comments/')) {
            return Promise.resolve({
              json: async () => [
                {},
                {
                  data: { children: [{ data: { body: 'Fake top comment' } }] },
                },
              ],
            });
          }
          return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
        }),
      );
    });

    test('maps, filters (ups>=10), and sanitizes correctly', async () => {
      const dps = await getRedditDataPoints('anySub', 10, 'day');

      expect(dps).toHaveLength(2);
      expect(dps[0]).toMatchObject({
        upvotes: 15,
        title: 'First Post',
        content: 'Content 1',
        topComment: 'Fake top comment',
      });
      expect(dps[1]).toMatchObject({
        upvotes: 20,
        title: 'Third Post',
        content: '',
        topComment: 'Fake top comment',
      });
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    test('sets topComment to null if comments fetch fails', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn((url: string) => {
          if (url.includes('/top.json')) {
            return Promise.resolve({
              json: async () => ({ data: { children: fakePosts } }),
            });
          }
          if (url.includes('/comments/')) {
            return Promise.reject(new Error('comments failed'));
          }
          return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
        }),
      );

      const dps = await getRedditDataPoints('anySub', 10, 'day');
      expect(dps.every((dp) => dp.topComment === null)).toBe(true);
    });

    test('throws if fetching posts fails', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockRejectedValueOnce(new Error('network down')),
      );
      await expect(getRedditDataPoints('anySub', 5, 'hour')).rejects.toThrow(
        'Failed to fetch Reddit posts: Error: network down',
      );
    });

    test('returns empty array when Reddit API response is invalid', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          json: async () => ({ foo: 'bar' }),
        }),
      );
      const result = await getRedditDataPoints('anySub', 5, 'hour');
      expect(result).toEqual([]);
    });
  });
});
