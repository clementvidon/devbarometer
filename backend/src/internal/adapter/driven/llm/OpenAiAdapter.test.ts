import { describe, test, expect, vi } from 'vitest';
import { OpenAiAdapter } from './OpenAiAdapter';
import type { AgentMessage } from '../../../core/types';
import OpenAI from 'openai';

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Hello world!' } }],
        }),
      },
    },
  })),
}));

describe('OpenAiAdapter', () => {
  test('returns the content from OpenAI API response', async () => {
    const openAiClient = new OpenAI() as unknown as OpenAI;
    const adapter = new OpenAiAdapter(openAiClient);

    const messages = [
      { role: 'user', content: 'Say hello' },
    ] as const satisfies AgentMessage[];

    const temperature = 0.1;
    const response = await adapter.run('gpt-3.5-turbo', temperature, messages);

    expect(response).toBe('Hello world!');
  });

  test('returns fallback when OpenAI returns no content', async () => {
    const mockOpenAI = new OpenAI() as unknown as OpenAI;
    (mockOpenAI.chat.completions.create as any).mockResolvedValueOnce({
      choices: [{ message: { content: null } }],
    });
    const adapter = new OpenAiAdapter(mockOpenAI);

    const messages = [
      { role: 'user', content: 'Say hello' },
    ] as const satisfies AgentMessage[];

    const result = await adapter.run('gpt-3.5-turbo', 0.1, messages);

    expect(result).toBe('');
  });
});
