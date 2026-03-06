import { describe, expect, test } from 'vitest';
import type { Item } from '../../../domain/entities';
import { makeRelevanceMessages } from './llmMessages';

describe(makeRelevanceMessages.name, () => {
  test('creates a system and user message for the relevance filter', () => {
    const item = {
      title: 'my-title',
      content: 'my-content',
    } as Item;
    const systemPrompt = 'my-system-prompt';

    const result = makeRelevanceMessages(item, systemPrompt);
    const [systemMessage, userMessage] = result;

    expect(result).toHaveLength(2);
    expect(systemMessage).toEqual({
      role: 'system',
      content: systemPrompt,
    });
    expect(userMessage.role).toBe('user');
    expect(userMessage.content).toContain(item.title);
    expect(userMessage.content).toContain(item.content);
  });
});
