import type OpenAI from 'openai';
import { describe, expect, test, vi } from 'vitest';
import type { LlmMessage } from '../../application/ports/output/LlmPort';
import { NoopLoggerAdapter } from '../logging/NoopLoggerAdapter';
import { OpenAIAdapter } from './OpenAIAdapter';

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

describe('OpenAIAdapter', () => {
  test('returns the content from OpenAI API response', async () => {
    const openAIClient = createMockOpenAI('Hello world!');
    const adapter = new OpenAIAdapter(openAIClient, new NoopLoggerAdapter());

    const messages = [
      { role: 'user', content: 'Say hello' },
    ] as const satisfies LlmMessage[];

    const response = await adapter.run('gpt-3.5-turbo', messages);

    expect(response).toBe('Hello world!');
  });
});
