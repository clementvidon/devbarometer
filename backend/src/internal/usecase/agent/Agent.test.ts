import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { Item, WeightedItem } from '../../core/entity/Item.ts';
import type { Report } from '../../core/entity/Report.ts';
import type { ItemsProviderPort } from '../../core/port/ItemsProviderPort.ts';
import type { LlmPort } from '../../core/port/LlmPort.ts';
import type { PersistencePort } from '../../core/port/PersistencePort.ts';
import type { WeightsPort } from '../../core/port/WeightsPort.ts';
import { Agent } from './Agent.ts';

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

vi.mock('../profiles/createProfiles.ts', () => ({
  createProfiles: vi.fn().mockResolvedValue(['emotionProfile']),
}));
vi.mock('../profiles/aggregateProfiles.ts', () => ({
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
vi.mock('../profiles/createReport.ts', () => ({
  createReport: vi.fn().mockResolvedValue({
    text: 'Everything looks great!',
    emoji: '☀️',
  } satisfies Report),
}));

describe('Agent captureSnapshot', () => {
  let persistence: PersistencePort;
  let agent: Agent;
  const report = {
    text: 'Everything looks great!',
    emoji: '☀️',
  };

  beforeEach(() => {
    persistence = {
      storeSnapshotAt: vi.fn(() => Promise.resolve()),
      getSnapshots: vi.fn(() => Promise.resolve([])),
    };
    agent = new Agent(itemsProvider, llm, persistence, weights);
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
