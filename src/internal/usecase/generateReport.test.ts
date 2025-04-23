import { describe, test, expect, vi, beforeEach } from 'vitest';
import { generateReport } from './generateReport';

const fakeLLMResponse = `
{
  "text": "Le climat est globalement positif avec quelques nuages.",
  "emoji": "🌤️"
}
`;

describe('generateReport', () => {
  describe('Happy path', () => {
    let llm: { run: vi.Mock };

    beforeEach(() => {
      vi.clearAllMocks();
      llm = {
        run: vi.fn().mockResolvedValue(fakeLLMResponse),
      };
    });

    test.only('returns valid report from correct LLM output', async () => {
      const emotions = { joy: 0.7, sadness: 0.1 };
      const report = await generateReport(emotions, llm);

      expect(report.text).toBe(
        'Le climat est globalement positif avec quelques nuages.',
      );
      expect(report.emoji).toBe('🌤️');
      expect(typeof report.timestamp).toBe('string');
      expect(new Date(report.timestamp).toString()).not.toBe('Invalid Date');
    });
  });
});
