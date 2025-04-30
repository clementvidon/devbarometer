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
    const messages: AgentMessage[] = [{ role: 'user', content: 'Say hello' }];
    const response = await adapter.run('gpt-3.5-turbo', messages);

    expect(response).toBe('Hello world!');
  });
});
