import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { EmotionProfileReport } from '../entity/EmotionProfileReport.ts';
import type { Item } from '../entity/Item.ts';
import type { ItemsProviderPort } from '../port/ItemsProviderPort.ts';
import type { LlmPort } from '../port/LlmPort.ts';
import type { PersistencePort } from '../port/PersistencePort.ts';
import type { RelevanceFilterPort } from '../port/RelevanceFilterPort.ts';
import type { PipelineSnapshot } from '../types/PipelineSnapshot.ts';
import { AgentService } from './AgentService.ts';

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

const mockItems: Item[] = [
  { source: 'reddit.com', title: 'Item 1', content: '', score: 1 },
];

const itemsProvider: ItemsProviderPort = {
  getItems: vi.fn(() => Promise.resolve(mockItems)),
  getLabel: vi.fn(() => 'provider://test'),
  getCreatedAt: vi.fn(() => '2025-08-01T00:00:00Z'),
};

const llm: LlmPort = {
  run: vi.fn(() => Promise.resolve('')),
};

const relevanceFilter: RelevanceFilterPort = {
  filterItems: vi.fn(() => Promise.resolve(mockItems)),
};

vi.mock('../../usecase/createEmotionProfiles', () => ({
  createEmotionProfiles: vi.fn().mockResolvedValue(['emotionProfile']),
}));
vi.mock('../../usecase/aggregateEmotionProfiles', () => ({
  aggregateEmotionProfiles: vi.fn().mockReturnValue({
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
vi.mock('../../usecase/generateEmotionProfileReport', () => ({
  generateEmotionProfileReport: vi.fn().mockResolvedValue({
    text: 'Everything looks great!',
    emoji: '☀️',
  } satisfies EmotionProfileReport),
}));

describe('AgentService updateReport', () => {
  let persistence: PersistencePort;
  let agent: AgentService;
  const report = {
    text: 'Everything looks great!',
    emoji: '☀️',
  };

  beforeEach(() => {
    persistence = {
      storeSnapshotAt: vi.fn(() => Promise.resolve()),
      getSnapshots: vi.fn(() => Promise.resolve([])),
    };
    agent = new AgentService(itemsProvider, llm, persistence, relevanceFilter);
    vi.clearAllMocks();
  });

  test('executes full pipeline and stores the report', async () => {
    const spy = vi.spyOn(persistence, 'storeSnapshotAt');
    await agent.updateReport();

    expect(spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ report }),
    );
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('handles empty items gracefully', async () => {
    const spy = vi.spyOn(persistence, 'storeSnapshotAt');
    await agent.updateReport();

    expect(spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ report }),
    );
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

const snapshot: PipelineSnapshot = {
  createdAt: '2025-08-01T00:00:00Z',
  id: 'mock-id',
  fetchLabel: 'test',
  items: [],
  relevantItems: [],
  weightedItems: [],
  emotionProfilePerItem: [
    {
      title: 'Item A',
      source: 'a',
      weight: 10,
      emotions: fakeEmotions,
      tonalities: fakeTonalities,
    },
    {
      title: 'Item B',
      source: 'b',
      weight: 30,
      emotions: fakeEmotions,
      tonalities: fakeTonalities,
    },
    {
      title: 'Item C',
      source: 'c',
      weight: 20,
      emotions: fakeEmotions,
      tonalities: fakeTonalities,
    },
    {
      title: 'Item D',
      source: 'd',
      weight: 5,
      emotions: fakeEmotions,
      tonalities: fakeTonalities,
    },
    {
      title: 'Item E',
      source: 'e',
      weight: 50,
      emotions: fakeEmotions,
      tonalities: fakeTonalities,
    },
    {
      title: 'Item F',
      source: 'f',
      weight: 15,
      emotions: fakeEmotions,
      tonalities: fakeTonalities,
    },
  ],
  aggregatedEmotionProfile: {
    date: '2025-08-01',
    count: 6,
    emotions: fakeEmotions,
    tonalities: fakeTonalities,
    totalWeight: 130,
  },
  report: {
    text: 'mock',
    emoji: '☀️',
  },
};

test('AgentService getLastTopHeadlines returns titles of N top weighted emotionProfile', async () => {
  const persistence: PersistencePort = {
    storeSnapshotAt: vi.fn(),
    getSnapshots: vi.fn().mockResolvedValue([snapshot]),
  };

  const agent = new AgentService(
    itemsProvider,
    llm,
    persistence,
    relevanceFilter,
  );

  const result = await agent.getLastTopHeadlines(3);
  expect(result).toEqual([
    { title: 'Item E', source: 'e', weight: '50' },
    { title: 'Item B', source: 'b', weight: '30' },
    { title: 'Item C', source: 'c', weight: '20' },
  ]);
});

test('AgentService getLastTopHeadlines returns empty array if no snapshot', async () => {
  const persistence: PersistencePort = {
    storeSnapshotAt: vi.fn(),
    getSnapshots: vi.fn().mockResolvedValue([]),
  };

  const agent = new AgentService(
    itemsProvider,
    llm,
    persistence,
    relevanceFilter,
  );
  const result = await agent.getLastTopHeadlines(3);
  expect(result).toEqual([]);
});
