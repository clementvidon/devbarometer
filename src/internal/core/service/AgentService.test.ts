import { describe, test, expect, vi, beforeEach } from 'vitest';
import { AgentService } from './AgentService';

const fetcher = { fetch: vi.fn() };
const llm = { run: vi.fn() };

vi.mock('../../usecase/fetchRedditPosts', () => ({
  fetchRedditPosts: vi.fn().mockResolvedValue(['post']),
}));

vi.mock('../../usecase/filterRelevantPosts', () => ({
  filterRelevantPosts: vi.fn().mockResolvedValue(['relevantPost']),
}));

vi.mock('../../usecase/analyzeSentiments', () => ({
  analyzeSentiments: vi.fn().mockResolvedValue(['postSentiment']),
}));

vi.mock('../../usecase/compressSentiments', () => ({
  compressSentiments: vi.fn().mockResolvedValue({ joy: 1 }),
}));

vi.mock('../../usecase/generateSentimentReport', () => ({
  generateSentimentReport: vi.fn().mockResolvedValue({
    text: 'Everything looks great!',
    emoji: '☀️',
    timestamp: '2025-01-01T00:00:00Z',
  }),
}));

describe('AgentService', () => {
  describe('run', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    test('executes full pipeline and returns a report', async () => {
      const agent = new AgentService(fetcher, llm);
      const report = await agent.run('anySub', 10, 'day');

      expect(report).toEqual({
        text: 'Everything looks great!',
        emoji: '☀️',
        timestamp: '2025-01-01T00:00:00Z',
      });
    });
  });
});
