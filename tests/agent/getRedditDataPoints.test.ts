import { describe, test, expect, vi, beforeEach } from 'vitest';
import { getRedditDataPoints } from '../../src/agent/getRedditDataPoints.ts';

const fakePosts = [
  { data: { id: '00', title: '1st\nPost', selftext: 'Content\n1', ups: 15 } },
  { data: { id: '01', title: '2nd Post', selftext: 'Content 2', ups: 5 } },
  { data: { id: '02', title: '3rd Post', selftext: '', ups: 20 } },
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
        title: '1st Post',
        content: 'Content 1',
        topComment: 'Fake top comment',
      });
      expect(dps[1]).toMatchObject({
        upvotes: 20,
        title: '3rd Post',
        content: '',
        topComment: 'Fake top comment',
      });
    });
  });
});
