import { describe, test, expect, vi, beforeEach } from 'vitest';
import { AgentService } from './AgentService';
import type { FetchPort } from '../port/FetchPort';
import type { LlmPort } from '../port/LlmPort';
import type { SentimentReport } from '../entity/SentimentReport';
import type { AgentMessage } from '../types/AgentMessage';
import { fetchRedditPosts } from '../../usecase/fetchRedditPosts';

const fetcher: FetchPort = {
  fetch: vi.fn(async () => new Response()),
};

const llm: LlmPort = {
  run: vi.fn(async (_model: string, _msg: AgentMessage[]) => ''),
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
    timestamp: '2025-01-01T00:00:00Z',
  }),
}));
vi.mock('../../usecase/generateSentimentReport', () => ({
  generateSentimentReport: vi.fn().mockResolvedValue({
    text: 'Everything looks great!',
    emoji: '☀️',
    timestamp: '2025-01-01T00:00:00Z',
  } as SentimentReport),
}));

describe('AgentService', () => {
  describe('Happy path', () => {
    let agent: AgentService;

    beforeEach(() => {
      vi.clearAllMocks();
      agent = new AgentService(fetcher, llm);
    });

    test('executes full pipeline and returns a report', async () => {
      const report = await agent.run('anySub', 10, 'day');

      expect(report).toEqual<SentimentReport>({
        text: 'Everything looks great!',
        emoji: '☀️',
        timestamp: '2025-01-01T00:00:00Z',
      });
    });
  });

  describe('Error handling', () => {
    let agent: AgentService;

    beforeEach(() => {
      vi.clearAllMocks();
      agent = new AgentService(fetcher, llm);
    });

    test('handles empty posts gracefully', async () => {
      vi.mocked(fetchRedditPosts).mockResolvedValue([]);

      const report = await agent.run('anySub', 10, 'day');

      expect(report).toEqual<SentimentReport>({
        text: 'Everything looks great!',
        emoji: '☀️',
        timestamp: '2025-01-01T00:00:00Z',
      });
    });
  });
});
