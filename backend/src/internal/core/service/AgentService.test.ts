import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchRedditPosts } from '../../usecase/fetchRedditPosts.ts';
import type { EmotionScores, Sentiment } from '../entity/Sentiment.ts';
import type { SentimentReport } from '../entity/SentimentReport.ts';
import type { FetchPort } from '../port/FetchPort.ts';
import type { LlmPort } from '../port/LlmPort.ts';
import type { PersistencePort } from '../port/PersistencePort.ts';
import type { PipelineSnapshot } from '../types/PipelineSnapshot.ts';
import { AgentService } from './AgentService.ts';

const mockEmotions: EmotionScores = {
  anger: 0,
  fear: 0,
  anticipation: 0,
  trust: 0,
  surprise: 0,
  sadness: 0,
  joy: 0,
  disgust: 0,
  negative: 0,
  positive: 0,
} as const;

const fetcher: FetchPort = {
  fetch: vi.fn(() => Promise.resolve(new Response())),
};

const llm: LlmPort = {
  run: vi.fn(() => Promise.resolve('')),
};

vi.mock('../../usecase/fetchRedditPosts', () => ({
  fetchRedditPosts: vi.fn().mockResolvedValue(['post']),
}));
vi.mock('../../usecase/filterRelevantPosts', () => ({
  filterRelevantPosts: vi.fn().mockResolvedValue(['relevantPost']),
}));
vi.mock('../../usecase/analyzeSentiments', () => ({
  analyzeSentiments: vi.fn().mockResolvedValue(['sentiment']),
}));
vi.mock('../../usecase/compressSentiments', () => ({
  compressSentiments: vi.fn().mockReturnValue({
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
vi.mock('../../usecase/generateSentimentReport', () => ({
  generateSentimentReport: vi.fn().mockResolvedValue({
    text: 'Everything looks great!',
    emoji: '☀️',
  } satisfies SentimentReport),
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
    vi.mocked(fetchRedditPosts).mockResolvedValue([]);
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
    sentimentPerPost: [],
    averageSentiment: {
      emotions: mockEmotions,
    },
    report: {
      text: 'Latest sentiment',
      emoji: '☀️',
    },
    ...overrides,
  };
}

describe('AgentService getLastSentimentReport', () => {
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

  test('returns the latest sentiment report if available', async () => {
    const expected: SentimentReport = {
      text: 'Latest sentiment',
      emoji: '☀️',
    };

    const snapshot = createMockSnapshot({ report: expected });
    vi.mocked(persistence.getSnapshots).mockResolvedValue([snapshot]);

    const result = await agent.getLastSentimentReport();
    expect(result).toEqual(expected);
  });

  test('returns null if no snapshots exist', async () => {
    vi.mocked(persistence.getSnapshots).mockResolvedValue([]);

    const result = await agent.getLastSentimentReport();
    expect(result).toBeNull();
  });
});

describe('AgentService getLastSentiments', () => {
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

  test('returns all sentiments from latest snapshot if available', async () => {
    const expected: Sentiment[] = [
      {
        title:
          'On m’a demandé de construire un agent LLM complet pour un test d’entretien',
        postId: '1m84v47',
        upvotes: 212,
        emotions: mockEmotions,
      },
      {
        title:
          'Ils m’ont fait bosser 6 heures sur un test… alors qu’ils avaient déjà choisi quelqu’un',
        postId: '1m78fpc',
        upvotes: 158,
        emotions: mockEmotions,
      },
    ];

    const snapshot = createMockSnapshot({ sentimentPerPost: expected });
    vi.mocked(persistence.getSnapshots).mockResolvedValue([snapshot]);

    const result = await agent.getLastSentiments();
    expect(result).toEqual(expected);
  });

  test('returns null if no snapshots exist', async () => {
    vi.mocked(persistence.getSnapshots).mockResolvedValue([]);

    const result = await agent.getLastSentiments();
    expect(result).toBeNull();
  });
});

test('AgentService getLastTopHeadlines returns titles of N top upvoted posts', async () => {
  const sentimentPerPost = [
    { title: 'Post A', upvotes: 10, postId: 'a', emotions: mockEmotions },
    { title: 'Post B', upvotes: 30, postId: 'b', emotions: mockEmotions },
    { title: 'Post C', upvotes: 20, postId: 'c', emotions: mockEmotions },
    { title: 'Post D', upvotes: 5, postId: 'd', emotions: mockEmotions },
    { title: 'Post E', upvotes: 50, postId: 'e', emotions: mockEmotions },
    { title: 'Post F', upvotes: 15, postId: 'f', emotions: mockEmotions },
  ];

  const snapshot = createMockSnapshot({ sentimentPerPost });

  const persistence: PersistencePort = {
    storeSnapshot: vi.fn(),
    getSnapshots: vi.fn().mockResolvedValue([snapshot]),
  };

  const agent = new AgentService(fetcher, llm, persistence);

  const result = await agent.getLastTopHeadlines(3);
  expect(result).toEqual([
    {
      title: 'Post E',
      upvotes: 50,
      url: 'https://www.reddit.com/comments/e',
    },
    {
      title: 'Post B',
      upvotes: 30,
      url: 'https://www.reddit.com/comments/b',
    },
    {
      title: 'Post C',
      upvotes: 20,
      url: 'https://www.reddit.com/comments/c',
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
