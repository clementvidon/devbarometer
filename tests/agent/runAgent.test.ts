import { describe, test, expect, vi, beforeEach } from 'vitest';
import { runAgent } from '../../src/agent/runAgent';

vi.mock('../../src/agent/getRedditDataPoints', () => ({
  getRedditDataPoints: vi.fn().mockResolvedValue(['dataPoint']),
}));

vi.mock('../../src/agent/filterDataPoints', () => ({
  filterDataPoints: vi.fn().mockResolvedValue(['filteredDataPoint']),
}));

vi.mock('../../src/agent/analyzeSentiments', () => ({
  analyzeSentiments: vi.fn().mockResolvedValue(['sentiment']),
}));

vi.mock('../../src/agent/compressSentiments', () => ({
  compressSentiments: vi.fn().mockResolvedValue({ emotions: { joy: 1 } }),
}));

vi.mock('../../src/agent/generateReport', () => ({
  generateReport: vi.fn().mockResolvedValue({
    text: 'Everything looks great!',
    emoji: '☀️',
    timestamp: '2025-01-01T00:00:00Z',
  }),
}));

describe('runAgent', () => {
  describe('Happy path', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    test('executes full pipeline and returns a report', async () => {
      const report = await runAgent();

      expect(report).toEqual({
        text: 'Everything looks great!',
        emoji: '☀️',
        timestamp: '2025-01-01T00:00:00Z',
      });
    });
  });
});
