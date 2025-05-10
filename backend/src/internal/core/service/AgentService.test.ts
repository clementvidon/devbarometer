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

const persistence: PersistencePort = {
  storeSnapshot: vi.fn(() => Promise.resolve()),
  getSnapshots: vi.fn(() => Promise.resolve([])),
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

describe('AgentService', () => {
  describe('Happy path', () => {
    let agent: AgentService;
    const spy = vi.spyOn(persistence, 'storeSnapshot');

    beforeEach(() => {
      vi.clearAllMocks();
      agent = new AgentService(fetcher, llm, persistence);
    });

    test('executes full pipeline and returns a report', async () => {
      const report = await agent.run('anySub', 10, 'day');

      expect(report).toEqual<SentimentReport>({
        text: 'Everything looks great!',
        emoji: '☀️',
      });

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error handling', () => {
    let agent: AgentService;
    const spy = vi.spyOn(persistence, 'storeSnapshot');

    beforeEach(() => {
      vi.clearAllMocks();
      agent = new AgentService(fetcher, llm, persistence);
    });

    test('handles empty posts gracefully', async () => {
      vi.mocked(fetchRedditPosts).mockResolvedValue([]);

      const report = await agent.run('anySub', 10, 'day');

      expect(report).toEqual<SentimentReport>({
        text: 'Everything looks great!',
        emoji: '☀️',
      });
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
