import { describe, test, expect, vi, beforeEach, beforeAll } from 'vitest';
import { filterDataPoints } from '../../src/agent/filterDataPoints';

vi.mock('../../src/llm/llm', () => ({
  runLLM: vi.fn(),
}));

import { runLLM } from '../../src/llm/llm';

const fakeDataPoints = [
  {
    title: 'Relevant Post A',
    content: 'Insightful',
    topComment: 'Top comment',
    upvotes: 10,
  },
  {
    title: 'Relevant Post B',
    content: 'Insightful',
    topComment: 'Top comment',
    upvotes: 5,
  },
  {
    title: 'Irrelevant Post',
    content: 'Off-topic',
    topComment: 'Top comment',
    upvotes: 20,
  },
];

describe('filterDataPoints', () => {
  beforeAll(() => {
    vi.stubGlobal('console', {
      error: vi.fn(),
      log: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
    });
  });

  describe('Happy path', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    test('filters only relevant data points', async () => {
      (runLLM as vi.Mock).mockImplementation(async (_model, messages) => {
        const content = messages[1].content;
        if (content.includes('Relevant')) {
          return '{ "relevant": true }';
        }
        return '{ "relevant": false }';
      });

      const filtered = await filterDataPoints(fakeDataPoints);
      expect(filtered).toHaveLength(2);
      expect(filtered.map((dp) => dp.title)).toEqual([
        'Relevant Post A',
        'Relevant Post B',
      ]);
      expect(console.log).toHaveBeenCalledWith(
        'Filtered 2/3 relevantDataPoints.',
      );
    });
  });
});
