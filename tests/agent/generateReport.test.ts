import { describe, test, expect, vi, beforeEach } from 'vitest';
import { generateReport } from '../../src/agent/generateReport';

vi.mock('../../src/llm/llm', () => ({
  runLLM: vi.fn(),
}));

import { runLLM } from '../../src/llm/llm';

const fakeLLMResponse = `
{
  "text": "Le climat est globalement positif avec quelques nuages.",
  "emoji": "🌤️"
}
`;

describe('generateReport', () => {
  describe('Happy path', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    test('returns valid report from correct LLM output', async () => {
      (runLLM as vi.Mock).mockResolvedValue(fakeLLMResponse);
      const emotionsText = '{"joy":0.7,"sadness":0.1}';
      const report = await generateReport(emotionsText);

      expect(report.text).toBe(
        'Le climat est globalement positif avec quelques nuages.',
      );
      expect(report.emoji).toBe('🌤️');
      expect(typeof report.timestamp).toBe('string');
      expect(new Date(report.timestamp).toString()).not.toBe('Invalid Date');
    });
  });
});
