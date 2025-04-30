import { describe, test, expect, vi, beforeEach } from 'vitest';
import { AgentService } from './AgentService';
import type { FetchPort } from '../port/FetchPort';
import type { LlmPort } from '../port/LlmPort';
import type { PersistencePort } from '../port/PersistencePort';
import type { SentimentReport } from '../entity/SentimentReport';
import type { AgentMessage } from '../types/AgentMessage';
import { fetchRedditPosts } from '../../usecase/fetchRedditPosts';

const fetcher: FetchPort = {
  fetch: vi.fn(async () => new Response()),
};

const llm: LlmPort = {
  run: vi.fn(
    async (_model: string, _temperature: number, _msg: AgentMessage[]) => '',
  ),
};

const persistence: PersistencePort = {
  storeSnapshot: vi.fn(async () => {}),
  getSnapshots: vi.fn(async () => []),
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
  } as SentimentReport),
}));

describe('AgentService', () => {
  describe('Happy path', () => {
    let agent: AgentService;

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
      expect(persistence.storeSnapshot).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error handling', () => {
    let agent: AgentService;

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
      expect(persistence.storeSnapshot).toHaveBeenCalledTimes(1);
    });
  });
});
