import type { Mock } from 'vitest';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { AverageEmotionProfile } from '../core/entity/EmotionProfile.ts';
import type { EmotionProfileReport } from '../core/entity/EmotionProfileReport.ts';
import { generateEmotionProfileReport } from './generateEmotionProfileReport.ts';

const fakeLLMResponse = `
{
  "text": "Le climat est globalement positif avec quelques nuages.",
  "emoji": "🌤️"
}
`;

const fakeAverageEmotionProfile: AverageEmotionProfile = {
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

const fakeEmotionProfileReport: EmotionProfileReport = {
  text: 'Le climat est globalement positif avec quelques nuages.',
  emoji: '🌤️',
};

describe('generateEmotionProfileReport', () => {
  describe('Happy path', () => {
    let llm: { run: Mock };

    beforeEach(() => {
      vi.clearAllMocks();
      llm = {
        run: vi.fn().mockResolvedValue(fakeLLMResponse),
      };
    });

    test('returns valid EmotionProfileReport from correct LLM output', async () => {
      const report = await generateEmotionProfileReport(
        fakeAverageEmotionProfile,
        llm,
      );

      expect(report).toEqual(fakeEmotionProfileReport);
    });
  });
});
