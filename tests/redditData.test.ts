import { describe, test, expect, vi, beforeEach } from 'vitest';
import { getRedditDataPoints } from '../src/reddit/redditData';
import sampleResponse from '../mocks/reddit-top-response.json';
import type { RedditAPIResponse } from '../src/reddit/types';

const getMockFetch = () => fetch as unknown as vi.Mock;

const mockTopComment = (body: string) => [
  {},
  {
    data: {
      children: [
        {
          data: { body },
        },
      ],
    },
  },
];

describe('getRedditDataPoints - Functional', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  test('returns DataPoints from local JSON (mock fetch)', async () => {
    const mockFetch = getMockFetch();

    mockFetch.mockResolvedValueOnce({
      json: async () => sampleResponse as RedditAPIResponse,
    });

    for (let i = 0; i < sampleResponse.data.children.length; i++) {
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
    const mockFetch = getMockFetch();
    const mockResponse = structuredClone(sampleResponse);
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
});
