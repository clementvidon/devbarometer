import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { WeatherEmoji } from '../../../core/entity/EmotionProfileReport.ts';
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

const fakeEmotions = {
  joy: 0,
  sadness: 0,
  anger: 0,
  fear: 0,
  trust: 0,
  disgust: 0,
} as const;

const fakeTonalities = {
  positive: 0,
  negative: 0,
  optimistic_anticipation: 0,
  pessimistic_anticipation: 0,
  positive_surprise: 0,
  negative_surprise: 0,
} as const;

function fakeSnapshot(
  overrides: Partial<Omit<PipelineSnapshot, 'id' | 'createdAt'>> = {},
): Omit<PipelineSnapshot, 'id' | 'createdAt'> {
  return {
    subreddit: 'anySub',
    fetchUrl: 'https://reddit.com/r/anySub/top',
    items: [],
    relevantItems: [],
    emotionProfilePerItem: [],
    aggregatedEmotionProfile: {
      date: '2025-08-03',
      count: 1,
      emotions: fakeEmotions,
      tonalities: fakeTonalities,
    },
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
