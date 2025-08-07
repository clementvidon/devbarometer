import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchRedditPosts } from '../../usecase/fetchRedditPosts.ts';
import type { EmotionProfile } from '../entity/EmotionProfile.ts';
import type { EmotionProfileReport } from '../entity/EmotionProfileReport.ts';
import type { FetchPort } from '../port/FetchPort.ts';
import type { LlmPort } from '../port/LlmPort.ts';
import type { PersistencePort } from '../port/PersistencePort.ts';
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

const fetcher: FetchPort = {
  fetch: vi.fn(() => Promise.resolve(new Response())),
};

const llm: LlmPort = {
  run: vi.fn(() => Promise.resolve('')),
};

vi.mock('../../usecase/fetchRedditPosts', () => ({
  fetchRedditPosts: vi.fn().mockResolvedValue({
    posts: ['post'],
    fetchUrl: 'https://reddit.com/r/mock/top.json',
  }),
}));
vi.mock('../../usecase/filterRelevantPosts', () => ({
  filterRelevantPosts: vi.fn().mockResolvedValue(['relevantPost']),
}));
vi.mock('../../usecase/analyzeEmotionProfiles', () => ({
  analyzeEmotionProfiles: vi.fn().mockResolvedValue(['emotionProfile']),
}));
vi.mock('../../usecase/compressEmotionProfiles', () => ({
  compressEmotionProfiles: vi.fn().mockReturnValue({
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
      storeSnapshot: vi.fn(() => Promise.resolve()),
      getSnapshots: vi.fn(() => Promise.resolve([])),
    };
    agent = new AgentService(fetcher, llm, persistence);
    vi.clearAllMocks();
  });

  test('executes full pipeline and stores the report', async () => {
    const spy = vi.spyOn(persistence, 'storeSnapshot');

    await agent.updateReport('anySub', 10, 'day');

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        report,
      }),
    );
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('handles empty posts gracefully', async () => {
    vi.mocked(fetchRedditPosts).mockResolvedValue({
      posts: [],
      fetchUrl: 'mocked-url',
    });
    const spy = vi.spyOn(persistence, 'storeSnapshot');

    await agent.updateReport('anySub', 10, 'day');

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        report,
      }),
    );
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

function createMockSnapshot(
  overrides: Partial<PipelineSnapshot> = {},
): PipelineSnapshot {
  return {
    id: 'mock-id',
    createdAt: new Date().toISOString(),
    subreddit: 'r/mockdev',
    fetchUrl: 'https://reddit.com/mock',
    posts: [],
    relevantPosts: [],
    emotionProfilePerPost: [],
    aggregatedEmotionProfile: {
      date: '2025-08-03',
      count: 1,
      emotions: fakeEmotions,
      tonalities: fakeTonalities,
    },
    report: {
      text: 'Latest emotionProfile',
      emoji: '☀️',
    },
    ...overrides,
  };
}

describe('AgentService getLastEmotionProfileReport', () => {
  let persistence: PersistencePort;
  let agent: AgentService;

  beforeEach(() => {
    persistence = {
      storeSnapshot: vi.fn(),
      getSnapshots: vi.fn(),
    };
    agent = new AgentService(fetcher, llm, persistence);
    vi.clearAllMocks();
  });

  test('returns the latest emotionProfile report if available', async () => {
    const expected: EmotionProfileReport = {
      text: 'Latest emotionProfile',
      emoji: '☀️',
    };

    const snapshot = createMockSnapshot({ report: expected });
    vi.mocked(persistence.getSnapshots).mockResolvedValue([snapshot]);

    const result = await agent.getLastEmotionProfileReport();
    expect(result).toEqual(expected);
  });

  test('returns null if no snapshots exist', async () => {
    vi.mocked(persistence.getSnapshots).mockResolvedValue([]);

    const result = await agent.getLastEmotionProfileReport();
    expect(result).toBeNull();
  });
});

describe('AgentService getLastEmotionProfiles', () => {
  let persistence: PersistencePort;
  let agent: AgentService;

  beforeEach(() => {
    persistence = {
      storeSnapshot: vi.fn(),
      getSnapshots: vi.fn(),
    };
    agent = new AgentService(fetcher, llm, persistence);
    vi.clearAllMocks();
  });

  test('returns all emotionProfiles from latest snapshot if available', async () => {
    const expected: EmotionProfile[] = [
      {
        title:
          'On m’a demandé de construire un agent LLM complet pour un test d’entretien',
        source: '1m84v47',
        weight: 212,
        emotions: fakeEmotions,
        tonalities: fakeTonalities,
      },
      {
        title:
          'Ils m’ont fait bosser 6 heures sur un test… alors qu’ils avaient déjà choisi quelqu’un',
        source: '1m78fpc',
        weight: 158,
        emotions: fakeEmotions,
        tonalities: fakeTonalities,
      },
    ];

    const snapshot = createMockSnapshot({ emotionProfilePerPost: expected });
    vi.mocked(persistence.getSnapshots).mockResolvedValue([snapshot]);

    const result = await agent.getLastEmotionProfiles();
    expect(result).toEqual(expected);
  });

  test('returns null if no snapshots exist', async () => {
    vi.mocked(persistence.getSnapshots).mockResolvedValue([]);

    const result = await agent.getLastEmotionProfiles();
    expect(result).toBeNull();
  });
});

test('AgentService getLastTopHeadlines returns titles of N top weighted emotionProfile', async () => {
  const emotionProfilePerPost = [
    {
      title: 'Post A',
      source: 'a',
      weight: 10,
      emotions: fakeEmotions,
      tonalities: fakeTonalities,
    },
    {
      title: 'Post B',
      source: 'b',
      weight: 30,
      emotions: fakeEmotions,
      tonalities: fakeTonalities,
    },
    {
      title: 'Post C',
      source: 'c',
      weight: 20,
      emotions: fakeEmotions,
      tonalities: fakeTonalities,
    },
    {
      title: 'Post D',
      source: 'd',
      weight: 5,
      emotions: fakeEmotions,
      tonalities: fakeTonalities,
    },
    {
      title: 'Post E',
      source: 'e',
      weight: 50,
      emotions: fakeEmotions,
      tonalities: fakeTonalities,
    },
    {
      title: 'Post F',
      source: 'f',
      weight: 15,
      emotions: fakeEmotions,
      tonalities: fakeTonalities,
    },
  ];

  const snapshot = createMockSnapshot({ emotionProfilePerPost });

  const persistence: PersistencePort = {
    storeSnapshot: vi.fn(),
    getSnapshots: vi.fn().mockResolvedValue([snapshot]),
  };

  const agent = new AgentService(fetcher, llm, persistence);

  const result = await agent.getLastTopHeadlines(3);
  expect(result).toEqual([
    {
      title: 'Post E',
      source: 'e',
      weight: 50,
    },
    {
      title: 'Post B',
      source: 'b',
      weight: 30,
    },
    {
      title: 'Post C',
      source: 'c',
      weight: 20,
    },
  ]);
});

test('getLastTopHeadlines returns empty array if no snapshot', async () => {
  const persistence: PersistencePort = {
    storeSnapshot: vi.fn(),
    getSnapshots: vi.fn().mockResolvedValue([]),
  };

  const agent = new AgentService(fetcher, llm, persistence);
  const result = await agent.getLastTopHeadlines();
  expect(result).toEqual([]);
});
