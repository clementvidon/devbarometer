import { describe, test, expect, vi, beforeEach } from 'vitest';
import { getRedditDataPoints } from '../src/agent/getRedditDataPoints.ts';

import redditData from '../mocks/redditData.json';

const mockFetchGlobal = () => fetch as unknown as vi.Mock;

const mockTopComment = (body: string) => [
  {},
  {
    data: {
      children: [{ data: { body } }],
    },
  },
];

describe('getRedditDataPoints - Functional', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  test('returns DataPoints from local JSON (mock fetch)', async () => {
    const mockFetch = mockFetchGlobal();

    mockFetch.mockResolvedValueOnce({
      json: async () => redditData,
    });

    for (let i = 0; i < redditData.data.children.length; i++) {
      mockFetch.mockResolvedValueOnce({
        json: async () => mockTopComment(`Mocked top comment for post ${i}`),
      });
    }

    const dataPoints = await getRedditDataPoints('subredditName', 10, 'week');

    expect(dataPoints.length).toBeGreaterThan(0);
    for (const dp of dataPoints) {
      expect(dp).toHaveProperty('title');
      expect(dp).toHaveProperty('content');
      expect(dp).toHaveProperty('upvotes');
      expect(dp).toHaveProperty('topComment');
    }
  });
});

describe('getRedditDataPoints - Error handling', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  test('returns null when fetchTopComment throws', async () => {
    const mockFetch = mockFetchGlobal();
    const mockResponse = structuredClone(redditData);
    mockResponse.data.children[0].data.ups = 100;

    mockFetch.mockResolvedValueOnce({
      json: async () => mockResponse,
    });

    mockFetch.mockRejectedValueOnce(new Error('fetchTopComment failed'));

    for (let i = 1; i < mockResponse.data.children.length; i++) {
      mockFetch.mockResolvedValueOnce({
        json: async () => mockTopComment(`Top comment ${i}`),
      });
    }

    const dataPoints = await getRedditDataPoints('france', 10, 'week');
    expect(dataPoints[0].topComment).toBeNull();
  });

  test('throws an error when fetchAllPosts fails', async () => {
    const mockFetch = vi.fn().mockRejectedValueOnce(new Error('API down'));
    vi.stubGlobal('fetch', mockFetch);

    await expect(getRedditDataPoints('france', 10, 'week')).rejects.toThrow(
      /Failed to fetch Reddit posts: Error: API down/,
    );
  });

  test('returns empty array when Reddit API response is invalid', async () => {
    const mockFetch = mockFetchGlobal();

    mockFetch.mockResolvedValueOnce({
      json: async () => ({ invalid: true }),
    });

    const dataPoints = await getRedditDataPoints('fakeSubreddit', 10, 'week');
    expect(dataPoints).toEqual([]);
  });

  test('throws when fetchAllPosts response throws sync error', async () => {
    const mockFetch = mockFetchGlobal();

    mockFetch.mockResolvedValueOnce({
      json: () => {
        throw new Error('sync JSON error');
      },
    });

    await expect(
      getRedditDataPoints('crashSubreddit', 10, 'week'),
    ).rejects.toThrow(/Failed to fetch Reddit posts: Error: sync JSON error/);
  });
});
