import type { Mock } from 'vitest';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { AverageSentiment } from '../core/entity/Sentiment.ts';
import type { SentimentReport } from '../core/entity/SentimentReport.ts';
import { generateSentimentReport } from './generateSentimentReport.ts';

const fakeLLMResponse = `
{
  "text": "Le climat est globalement positif avec quelques nuages.",
  "emoji": "🌤️"
}
`;

const fakeAverageSentiment: AverageSentiment = {
  emotions: {
    anger: 0,
    fear: 0,
    anticipation: 0,
    trust: 0,
    surprise: 0,
    sadness: 0.1,
    joy: 0.7,
    disgust: 0,
    negative: 0,
    positive: 0,
  },
};

const fakeSentimentReport: SentimentReport = {
  text: 'Le climat est globalement positif avec quelques nuages.',
  emoji: '🌤️',
};

describe('generateSentimentReport', () => {
  describe('Happy path', () => {
    let llm: { run: Mock };

    beforeEach(() => {
      vi.clearAllMocks();
      llm = {
        run: vi.fn().mockResolvedValue(fakeLLMResponse),
      };
    });

    test('returns valid SentimentReport from correct LLM output', async () => {
      const report = await generateSentimentReport(fakeAverageSentiment, llm);

      expect(report).toEqual(fakeSentimentReport);
    });
  });
});
