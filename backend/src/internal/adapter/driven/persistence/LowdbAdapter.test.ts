import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { WeatherEmoji } from '../../../core/entity/SentimentReport.ts';
import type { PipelineSnapshot } from '../../../core/types/PipelineSnapshot.ts';
import { LowdbAdapter } from './LowdbAdapter.ts';

interface MockedLowdb {
  data: { snapshots: PipelineSnapshot[] };
  write: () => void;
}

const mockLowdb: MockedLowdb = {
  data: { snapshots: [] },
  write: vi.fn(),
};

vi.mock('lowdb/node', () => ({
  JSONFilePreset: vi.fn(() => mockLowdb),
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
    mockLowdb.data.snapshots = [];
    adapter = new LowdbAdapter();
  });

  describe('Happy path', () => {
    test('stores and retrieves a snapshot', async () => {
      await adapter.storeSnapshot(fakeSnapshot());
      const snapshots = await adapter.getSnapshots();

      expect(snapshots).toHaveLength(1);
      expect(snapshots[0].id).toBe('mocked-uuid');
      expect(typeof snapshots[0].createdAt).toBe('string');
    });
  });
});
