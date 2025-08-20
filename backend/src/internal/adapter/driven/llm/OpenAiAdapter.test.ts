import type OpenAI from 'openai';
import { describe, expect, test, vi } from 'vitest';
import type { AgentMessage } from '../../../core/types/AgentMessage.ts';
import { OpenAiAdapter } from './OpenAiAdapter.ts';

function createMockOpenAI(content: string | null): OpenAI {
  return {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content } }],
        }),
      },
    },
  } as unknown as OpenAI;
}

describe('OpenAiAdapter', () => {
  test('returns the content from OpenAI API response', async () => {
    const openAiClient = createMockOpenAI('Hello world!');
    const adapter = new OpenAiAdapter(openAiClient);

    const messages = [
      { role: 'user', content: 'Say hello' },
    ] as const satisfies AgentMessage[];

    const response = await adapter.run('gpt-3.5-turbo', messages);

    expect(response).toBe('Hello world!');
  });
});
