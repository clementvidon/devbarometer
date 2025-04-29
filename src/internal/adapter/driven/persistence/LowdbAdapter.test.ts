import { describe, test, expect, vi, beforeEach } from 'vitest';
import { LowdbAdapter } from './LowdbAdapter';
import type { PipelineSnapshot } from '../../../core/types/PipelineSnapshot';
import type { WeatherEmoji } from '../../../core/entity/SentimentReport';

vi.mock('lowdb/node', () => ({
  JSONFilePreset: vi.fn(() => ({
    data: { snapshots: [] },
    write: vi.fn(),
  })),
}));

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mocked-uuid'),
}));

const emotions = {
  joy: 1,
  sadness: 0,
  anger: 0,
  fear: 0,
  anticipation: 0,
  trust: 0,
  surprise: 0,
  disgust: 0,
  positive: 0,
  negative: 0,
} as const;

function fakeSnapshot(
  overrides: Partial<Omit<PipelineSnapshot, 'id' | 'createdAt'>> = {},
): Omit<PipelineSnapshot, 'id' | 'createdAt'> {
  return {
    subreddit: 'anySub',
    fetchUrl: 'https://reddit.com/r/anySub/top',
    posts: [],
    relevantPosts: [],
    sentimentPerPost: [],
    averageSentiment: { emotions },
    report: { text: 'Fake report', emoji: '☀️' as WeatherEmoji },
    ...overrides,
  };
}

describe('LowdbAdapter', () => {
  let adapter: LowdbAdapter;

  beforeEach(() => {
    vi.restoreAllMocks();
    adapter = new LowdbAdapter();
  });

  describe('Happy path', () => {
    test('stores and retrieves a snapshot', async () => {
      await adapter.storeSnapshot(fakeSnapshot());
      const snapshots = await adapter.getSnapshots();

      expect(snapshots).toHaveLength(1);
      expect(snapshots[0]).toMatchObject({
        id: 'mocked-uuid',
        createdAt: expect.any(String),
      });
    });
  });
});
