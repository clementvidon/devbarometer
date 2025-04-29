import { describe, test, expect, beforeEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import { generateSentimentReport } from './generateSentimentReport';
import type { AverageSentiment } from '../core/entity/Sentiment';
import type { SentimentReport } from '../core/entity/SentimentReport';

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

    describe('Error handling', () => {
      let llm: { run: Mock };

      beforeEach(() => {
        vi.clearAllMocks();
        llm = {
          run: vi.fn(),
        };
      });

      test('returns fallback report if LLM throws an error', async () => {
        llm.run.mockRejectedValue(new Error('LLM Failure'));

        const report = await generateSentimentReport(fakeAverageSentiment, llm);

        expect(report).toMatchObject({
          text: 'Report unavailable.',
          emoji: '☁️',
        });
      });

      test('returns fallback report if LLM returns invalid JSON', async () => {
        llm.run.mockResolvedValue('not a valid JSON');

        const report = await generateSentimentReport(fakeAverageSentiment, llm);

        expect(report).toMatchObject({
          text: 'Report unavailable.',
          emoji: '☁️',
        });
      });

      test('returns fallback report if LLM returns wrong schema', async () => {
        llm.run.mockResolvedValue(
          JSON.stringify({ wrongKey: 'oops', emoji: '🌤️' }),
        );

        const report = await generateSentimentReport(fakeAverageSentiment, llm);

        expect(report).toMatchObject({
          text: 'Report unavailable.',
          emoji: '☁️',
        });
      });
    });
  });
});
