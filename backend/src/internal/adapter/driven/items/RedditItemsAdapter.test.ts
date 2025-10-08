import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import type { FetchPort } from '../../../../application/ports/FetchPort';
import {
  fetchRedditItems,
  RedditItemsAdapter,
  type RedditItemsOptions,
} from './RedditItemsAdapter';

vi.mock('./redditAuth', () => ({
  getRedditAccessToken: vi.fn().mockResolvedValue('mocked-access-token'),
}));

beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterAll(() => vi.restoreAllMocks());

const fakeResponse = (
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: new Headers({ 'Content-Type': 'application/json', ...headers }),
  });

const fakeOpts = {
  minScore: 5,
  userAgentSuffix: 'hello',
  baseBackoffMs: 42,
} as const satisfies RedditItemsOptions;

const fakePosts = [
  { data: { id: '00', title: '1st\nItem', selftext: 'Content\n1', ups: 15 } },
  { data: { id: '01', title: '2nd Item', selftext: 'Content 2', ups: 1 } },
  { data: { id: '02', title: '3rd Item', selftext: '', ups: 20 } },
];

const runWithFakeTimers = async <T>(fn: () => Promise<T>) => {
  vi.useFakeTimers();
  const p = fn();
  await vi.runAllTimersAsync();
  const res = await p;
  vi.useRealTimers();
  return res;
};

describe('fetchRedditItems', () => {
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
          return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
        }),
      };
    });

    test('maps, filters (ups>=5), and sanitizes correctly', async () => {
      const items = await fetchRedditItems(
        fetcher,
        'https://oauth.reddit.com/r/mock/top.json?limit=3&t=week&raw_json=1',
        fakeOpts,
      );

      expect(items).toHaveLength(2);
      expect(items[0]).toMatchObject({
        source: 'https://reddit.com/comments/00',
        title: '1st Item',
        content: 'Content 1',
        score: 15,
      });
      expect(items[1]).toMatchObject({
        source: 'https://reddit.com/comments/02',
        title: '3rd Item',
        content: '',
        score: 20,
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

      const items = await runWithFakeTimers(() =>
        fetchRedditItems(fetcher, 'url', fakeOpts),
      );
      expect(items).toHaveLength(2);
    });

    test('retries if fetch rejects', async () => {
      fetcher.fetch = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(fakeResponse({ data: { children: fakePosts } }));

      const items = await runWithFakeTimers(() =>
        fetchRedditItems(fetcher, 'url', fakeOpts),
      );
      expect(items).toHaveLength(2);
    });

    test('returns empty array if Reddit item JSON is invalid', async () => {
      fetcher.fetch = vi.fn(() =>
        Promise.resolve(fakeResponse({ wrong: 'format' })),
      );
      const items = await fetchRedditItems(fetcher, 'invalidUrl', fakeOpts);
      expect(items).toEqual([]);
    });

    test('returns empty array if no items found', async () => {
      fetcher.fetch = vi.fn(() =>
        Promise.resolve(fakeResponse({ data: { children: [] } })),
      );
      const items = await fetchRedditItems(fetcher, 'url', fakeOpts);
      expect(items).toEqual([]);
    });

    test('returns empty array if no items meet the minimum score', async () => {
      fetcher.fetch = vi.fn(() =>
        Promise.resolve(
          fakeResponse({
            data: {
              children: [
                { data: { id: 'low', title: 'x', selftext: '...', ups: 2 } },
              ],
            },
          }),
        ),
      );
      const items = await fetchRedditItems(fetcher, 'url', fakeOpts);
      expect(items).toEqual([]);
    });
  });
});

describe('RedditItemsAdapter', () => {
  test('delegates getItems to fetchRedditItems', async () => {
    const fetcher: FetchPort = {
      fetch: vi
        .fn()
        .mockResolvedValue(fakeResponse({ data: { children: fakePosts } })),
    };
    const adapter = new RedditItemsAdapter(
      fetcher,
      'https://oauth.reddit.com/r/mock/top.json?limit=3&t=week&raw_json=1',
    );
    const items = await adapter.getItems();

    expect(items).toHaveLength(2);
    expect(items[0].title).toBe('1st Item');
  });
});
