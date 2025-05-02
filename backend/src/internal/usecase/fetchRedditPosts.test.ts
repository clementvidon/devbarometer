import {
  describe,
  test,
  expect,
  vi,
  beforeEach,
  beforeAll,
  afterAll,
} from 'vitest';
import { fetchRedditPosts } from './fetchRedditPosts';
import type { FetchPort } from '../core/port/FetchPort';

beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  vi.restoreAllMocks();
});

const fakeResponse = (
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: new Headers(headers),
  });

const fakePosts = [
  { data: { id: '00', title: '1st\nPost', selftext: 'Content\n1', ups: 15 } },
  { data: { id: '01', title: '2nd Post', selftext: 'Content 2', ups: 5 } },
  { data: { id: '02', title: '3rd Post', selftext: '', ups: 20 } },
];

const runWithFakeTimers = async <T>(fn: () => Promise<T>) => {
  vi.useFakeTimers();
  const p = fn();
  await vi.runAllTimersAsync();
  const res = await p;
  vi.useRealTimers();
  return res;
};

describe('fetchRedditPosts', () => {
  describe('Happy path', () => {
    let fetcher: FetchPort;

    beforeEach(() => {
      vi.restoreAllMocks();
      fetcher = {
        fetch: vi.fn((url: string) => {
          if (url.includes('/top.json')) {
            return Promise.resolve(
              fakeResponse({ data: { children: fakePosts } }),
            );
          }
          if (url.includes('/comments/')) {
            return Promise.resolve(
              fakeResponse([
                {},
                {
                  data: { children: [{ data: { body: 'Fake top comment' } }] },
                },
              ]),
            );
          }
          return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
        }),
      };
    });

    test('maps, filters (ups>=10), and sanitizes correctly', async () => {
      const posts = await fetchRedditPosts(fetcher, 'anySub', 10, 'day');

      expect(posts).toHaveLength(2);
      expect(posts[0]).toMatchObject({
        upvotes: 15,
        title: '1st Post',
        content: 'Content 1',
        topComment: 'Fake top comment',
      });
      expect(posts[1]).toMatchObject({
        upvotes: 20,
        title: '3rd Post',
        content: '',
        topComment: 'Fake top comment',
      });
    });
  });

  describe('Error handling', () => {
    let fetcher: FetchPort;

    beforeEach(() => {
      vi.restoreAllMocks();
      fetcher = { fetch: vi.fn() };
    });

    test('retries if Reddit returns 429 Too Many Requests', async () => {
      fetcher.fetch = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(null, {
            status: 429,
            headers: new Headers({ 'X-Ratelimit-Reset': '1' }),
          }),
        )
        .mockResolvedValueOnce(fakeResponse({ data: { children: fakePosts } }));

      const posts = await runWithFakeTimers(() =>
        fetchRedditPosts(fetcher, 'anySub', 10, 'day'),
      );
      expect(posts).toHaveLength(2);
    });

    test('retries if fetch rejects', async () => {
      fetcher.fetch = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(fakeResponse({ data: { children: fakePosts } }));

      const posts = await runWithFakeTimers(() =>
        fetchRedditPosts(fetcher, 'anySub', 10, 'day'),
      );
      expect(posts).toHaveLength(2);
    });

    test('returns empty array if Reddit post JSON is invalid', async () => {
      fetcher.fetch = vi.fn(() =>
        Promise.resolve(fakeResponse({ wrong: 'format' })),
      );

      const posts = await fetchRedditPosts(
        fetcher,
        'invalidSubreddit',
        10,
        'day',
      );
      expect(posts).toEqual([]);
    });

    test('returns empty array if no posts found', async () => {
      fetcher.fetch = vi.fn(() =>
        Promise.resolve(fakeResponse({ data: { children: [] } })),
      );

      const posts = await fetchRedditPosts(fetcher, 'anySub', 10, 'day');
      expect(posts).toEqual([]);
    });

    test('returns empty array if no posts meet the minimum upvotes', async () => {
      fetcher.fetch = vi.fn(() =>
        Promise.resolve(
          fakeResponse({
            data: {
              children: [
                {
                  data: {
                    id: 'low',
                    title: 'Low upvote',
                    selftext: '...',
                    ups: 2,
                  },
                },
              ],
            },
          }),
        ),
      );

      const posts = await fetchRedditPosts(fetcher, 'anySub', 10, 'day');
      expect(posts).toEqual([]);
    });

    test('returns null if top comment JSON is invalid', async () => {
      fetcher.fetch = vi.fn((url: string) => {
        if (url.includes('/top.json')) {
          return Promise.resolve(
            fakeResponse({ data: { children: fakePosts } }),
          );
        }
        if (url.includes('/comments/')) {
          return Promise.resolve(fakeResponse({ wrong: 'format' }));
        }
        return Promise.reject(new Error('Unexpected fetch URL'));
      });

      const posts = await fetchRedditPosts(fetcher, 'anySub', 10, 'day');
      expect(posts[0].topComment).toBeNull();
    });

    test('sets topComment to null if no top comment found', async () => {
      fetcher.fetch = vi.fn((url: string) => {
        if (url.includes('/top.json')) {
          return Promise.resolve(
            fakeResponse({ data: { children: fakePosts } }),
          );
        }
        if (url.includes('/comments/')) {
          return Promise.resolve(fakeResponse([{}]));
        }
        return Promise.reject(new Error('Unexpected fetch URL'));
      });

      const posts = await fetchRedditPosts(fetcher, 'anySub', 10, 'day');
      expect(posts[0].topComment).toBeNull();
    });

    test('returns empty array if Reddit is unreachable after retries', async () => {
      fetcher.fetch = vi.fn().mockRejectedValue(new Error('Network down'));

      const posts = await runWithFakeTimers(() =>
        fetchRedditPosts(fetcher, 'anySub', 10, 'day'),
      );

      expect(posts).toEqual([]);
    });
  });
});
