import { describe, test, expect, vi, beforeEach } from 'vitest';
import { filterDataPoints } from './filterDataPoints';

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
  describe('Happy path', () => {
    let llm: { run: vi.Mock };

    beforeEach(() => {
      vi.clearAllMocks();
      llm = {
        run: vi.fn(async (_model, messages) => {
          const content = messages[1].content;
          if (content.includes('Relevant')) {
            return '{ "relevant": true }';
          }
          return '{ "relevant": false }';
        }),
      };
    });

    test.only('filters relevant data points correctly', async () => {
      const relevantDataPoints = await filterDataPoints(fakeDataPoints, llm);

      expect(relevantDataPoints).toHaveLength(2);
      expect(relevantDataPoints.map((dp) => dp.title)).toEqual([
        'Relevant Post A',
        'Relevant Post B',
      ]);
    });
  });
});
