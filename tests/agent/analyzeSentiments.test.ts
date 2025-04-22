import { describe, test, expect, vi, beforeEach } from 'vitest';
import { analyzeSentiments } from '../../src/agent/analyzeSentiments';

vi.mock('../../src/llm/llm', () => ({
  runLLM: vi.fn(),
}));

import { runLLM } from '../../src/llm/llm';

const fakeDataPoints = [
  {
    title: 'Post A',
    content: 'Great job market',
    topComment: 'I agree',
    upvotes: 15,
  },
  {
    title: 'Post B',
    content: 'Not sure about this',
    topComment: 'Interesting',
    upvotes: 7,
  },
];

const fakeEmotions = {
  anger: 0.1,
  fear: 0.2,
  anticipation: 0.3,
  trust: 0.4,
  surprise: 0.5,
  sadness: 0.1,
  joy: 0.6,
  disgust: 0.05,
  negative: 0.15,
  positive: 0.85,
};

describe('analyzeSentiments', () => {
  describe('Happy path', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    test('analyzes data points and returns sentiment results', async () => {
      (runLLM as vi.Mock).mockResolvedValue(JSON.stringify(fakeEmotions));
      const sentiments = await analyzeSentiments(fakeDataPoints);

      expect(sentiments).toHaveLength(2);
      sentiments.forEach((res, index) => {
        expect(res.title).toBe(fakeDataPoints[index].title);
        expect(res.upvotes).toBe(fakeDataPoints[index].upvotes);
        expect(res.emotions).toEqual(fakeEmotions);
      });
      expect(console.log).toHaveBeenCalledWith('Analyzed 2/2 posts.');
    });
  });
});
