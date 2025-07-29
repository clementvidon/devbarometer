import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchRedditPosts } from '../../usecase/fetchRedditPosts.ts';
import type { SentimentReport } from '../entity/SentimentReport.ts';
import type { FetchPort } from '../port/FetchPort.ts';
import type { LlmPort } from '../port/LlmPort.ts';
import type { PersistencePort } from '../port/PersistencePort.ts';
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

describe('AgentService getLastReport', () => {
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

    vi.mocked(persistence.getSnapshots).mockResolvedValue([
      {
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
        report: expected, // ta vraie valeur SentimentReport
      },
    ]);

    const result = await agent.getLastReport();
    expect(result).toEqual(expected);
  });

  test('returns null if no snapshots exist', async () => {
    vi.mocked(persistence.getSnapshots).mockResolvedValue([]);

    const result = await agent.getLastReport();
    expect(result).toBeNull();
  });
});
