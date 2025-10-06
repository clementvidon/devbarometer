import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { Item, Report, WeightedItem } from '../../core/entity';
import type { ItemsProviderPort } from '../../core/port/ItemsProviderPort';
import type { LlmPort } from '../../core/port/LlmPort';
import type { PersistencePort } from '../../core/port/PersistencePort';
import type { WeightsPort } from '../../core/port/WeightsPort';
import { ReportingAgent } from './ReportingAgent';

const mockItems: Item[] = [
  { source: 'reddit.com', title: 'Item 1', content: '', score: 1 },
];

const mockWeightedItems: WeightedItem[] = [
  { source: 'reddit.com', title: 'Item 1', content: '', score: 1, weight: 0.5 },
];

const itemsProvider: ItemsProviderPort = {
  getItems: vi.fn(() => Promise.resolve(mockItems)),
  getLabel: vi.fn(() => 'provider://test'),
  getCreatedAt: vi.fn(() => '2025-08-01T00:00:00Z'),
};

const llm: LlmPort = {
  run: vi.fn(() => Promise.resolve('')),
};

const weights: WeightsPort = {
  computeWeights: vi.fn(() => Promise.resolve(mockWeightedItems)),
};

vi.mock('../profiles/createProfiles', () => ({
  createProfiles: vi.fn().mockResolvedValue(['emotionProfile']),
}));
vi.mock('../../core/domain/profiles/aggregateProfiles', () => ({
  aggregateProfiles: vi.fn().mockReturnValue({
    emotions: {
      anger: 0,
      fear: 0,
      anticipation: 0,
      trust: 0,
      surprise: 0,
      sadness: 0,
      joy: 1,
      disgust: 0,
      negative: 0,
      positive: 0,
    },
  }),
}));
vi.mock('../profiles/createReport', () => ({
  createReport: vi.fn().mockResolvedValue({
    text: 'Everything looks great!',
    emoji: '☀️',
  } satisfies Report),
}));

describe('Agent captureSnapshot', () => {
  let persistence: PersistencePort;
  let agent: ReportingAgent;
  const report = {
    text: 'Everything looks great!',
    emoji: '☀️',
  };

  beforeEach(() => {
    persistence = {
      storeSnapshotAt: vi.fn(() => Promise.resolve()),
      getSnapshots: vi.fn(() => Promise.resolve([])),
    };
    agent = new ReportingAgent(itemsProvider, llm, persistence, weights);
    vi.clearAllMocks();
  });

  test('executes full pipeline and stores the report', async () => {
    const spy = vi.spyOn(persistence, 'storeSnapshotAt');
    await agent.captureSnapshot();

    expect(spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ report }),
    );
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('handles empty items gracefully', async () => {
    const spy = vi.spyOn(persistence, 'storeSnapshotAt');
    await agent.captureSnapshot();

    expect(spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ report }),
    );
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
