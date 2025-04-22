import { describe, test, expect, vi, beforeEach } from 'vitest';
import { runLLM } from '../../src/llm/llm';

vi.mock('../../src/llm/ai', () => ({
  ai: {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  },
}));

import { ai } from '../../src/llm/ai';

describe('runLLM', () => {
  describe('Happy path', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    test('calls OpenAI and returns the message content', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Mocked response content' } }],
      };
      (ai.chat.completions.create as vi.Mock).mockResolvedValue(mockResponse);
      const model = 'gpt-4o-mini';
      const messages = [
        { role: 'system', content: 'Hello system' },
        { role: 'user', content: 'Hello user' },
      ];
      const result = await runLLM(model, messages);

      expect(ai.chat.completions.create).toHaveBeenCalledWith({
        model,
        temperature: 0.1,
        messages,
      });
      expect(result).toBe('Mocked response content');
    });
  });
});
