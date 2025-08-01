import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchRedditPosts } from '../../usecase/fetchRedditPosts.ts';
import type { Sentiment } from '../entity/Sentiment.ts';
import type { SentimentReport } from '../entity/SentimentReport.ts';
import type { FetchPort } from '../port/FetchPort.ts';
import type { LlmPort } from '../port/LlmPort.ts';
import type { PersistencePort } from '../port/PersistencePort.ts';
import type { PipelineSnapshot } from '../types/PipelineSnapshot.ts';
import { AgentService } from './AgentService.ts';

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
        positive: 1,
      },
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
        emotions: {
          joy: 0.1,
          fear: 0.4,
          anger: 0.7,
          trust: 0.2,
          disgust: 0.8,
          sadness: 0.5,
          negative: 0.9,
          positive: 0.2,
          surprise: 0.3,
          anticipation: 0.6,
        },
      },
      {
        title:
          'Ils m’ont fait bosser 6 heures sur un test… alors qu’ils avaient déjà choisi quelqu’un',
        postId: '1m78fpc',
        upvotes: 158,
        emotions: {
          joy: 0.1,
          fear: 0.6,
          anger: 0.8,
          trust: 0.2,
          disgust: 0.4,
          sadness: 0.7,
          negative: 0.9,
          positive: 0.2,
          surprise: 0.5,
          anticipation: 0.7,
        },
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
