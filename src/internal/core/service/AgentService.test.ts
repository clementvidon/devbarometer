import { describe, test, expect, vi, beforeEach } from 'vitest';
import { AgentService } from './AgentService';

const fetcher = { fetch: vi.fn() };
const llm = { run: vi.fn() };

vi.mock('../../usecase/getRedditDataPoints', () => ({
  getRedditDataPoints: vi.fn().mockResolvedValue(['dataPoint']),
}));

vi.mock('../../usecase/filterDataPoints', () => ({
  filterDataPoints: vi.fn().mockResolvedValue(['filteredDataPoint']),
}));

vi.mock('../../usecase/analyzeSentiments', () => ({
  analyzeSentiments: vi.fn().mockResolvedValue(['sentiment']),
}));

vi.mock('../../usecase/compressSentiments', () => ({
  compressSentiments: vi.fn().mockResolvedValue({ joy: 1 }),
}));

vi.mock('../../usecase/generateReport', () => ({
  generateReport: vi.fn().mockResolvedValue({
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
