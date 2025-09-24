import type { Mock } from 'vitest';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { AggregatedEmotionProfile } from '../../core/entity/EmotionProfile';
import type { Report } from '../../core/entity/Report.ts';
import { createReport } from './createReport.ts';

const fakeLLMResponse = `
{
  "text": "Le climat est globalement positif avec quelques nuages.",
  "emoji": "🌤️"
}
`;

const fakeAggregatedEmotionProfile: AggregatedEmotionProfile = {
  date: '2025-08-03',
  count: 1,
  emotions: {
    joy: 0,
    sadness: 0,
    anger: 0,
    fear: 0,
    trust: 0,
    disgust: 0,
  },
  tonalities: {
    positive: 0,
    negative: 0,
    optimistic_anticipation: 0,
    pessimistic_anticipation: 0,
    positive_surprise: 0,
    negative_surprise: 0,
  },
  totalWeight: 1,
};

const fakeReport: Report = {
  text: 'Le climat est globalement positif avec quelques nuages.',
  emoji: '🌤️',
};

describe('createProfileReport', () => {
  describe('Happy path', () => {
    let llm: { run: Mock };

    beforeEach(() => {
      vi.clearAllMocks();
      llm = {
        run: vi.fn().mockResolvedValue(fakeLLMResponse),
      };
    });

    test('returns valid Report from correct LLM output', async () => {
      const report = await createReport(fakeAggregatedEmotionProfile, llm);

      expect(report).toEqual(fakeReport);
    });
  });
});
