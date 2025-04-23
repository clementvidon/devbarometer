import { describe, test, expect, vi, beforeEach } from 'vitest';
import { fetchRedditPosts } from './fetchRedditPosts';
import type { FetchPort } from '../core/port/FetchPort';

const fakePosts = [
  { data: { id: '00', title: '1st\nPost', selftext: 'Content\n1', ups: 15 } },
  { data: { id: '01', title: '2nd Post', selftext: 'Content 2', ups: 5 } },
  { data: { id: '02', title: '3rd Post', selftext: '', ups: 20 } },
];

describe('fetchRedditPosts', () => {
  describe('Happy path', () => {
    let fetcher: FetchPort;

    beforeEach(() => {
      vi.restoreAllMocks();
      fetcher = {
        fetch: vi.fn((url: string) => {
          if (url.includes('/top.json')) {
            return Promise.resolve({
              status: 200,
              json: async () => ({ data: { children: fakePosts } }),
            });
          }
          if (url.includes('/comments/')) {
            return Promise.resolve({
              status: 200,
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
      };
    });

    test.only('maps, filters (ups>=10), and sanitizes correctly', async () => {
      const dataPoints = await fetchRedditPosts(fetcher, 'anySub', 10, 'day');

      expect(dataPoints).toHaveLength(2);
      expect(dataPoints[0]).toMatchObject({
        upvotes: 15,
        title: '1st Post',
        content: 'Content 1',
        topComment: 'Fake top comment',
      });
      expect(dataPoints[1]).toMatchObject({
        upvotes: 20,
        title: '3rd Post',
        content: '',
        topComment: 'Fake top comment',
      });
    });
  });
});
