import { describe, expect, test } from 'vitest';
import type { WeightedItem } from '../../../domain/entities';
import { makeProfileMessages } from './llmMessages';

describe('makeProfileMessages', () => {
  test('creates a system and user message for the emotion profile creation', () => {
    const weightedItem = {
      title: 'my-title',
      content: 'my-content',
    } as WeightedItem;
    const systemPrompt = 'my-system-prompt';

    const result = makeProfileMessages(weightedItem, systemPrompt);
    const [systemMessage, userMessage] = result;

    expect(result).toHaveLength(2);
    expect(systemMessage).toEqual({
      role: 'system',
      content: systemPrompt,
    });
    expect(userMessage.role).toBe('user');
    expect(userMessage.content).toContain(weightedItem.title);
    expect(userMessage.content).toContain(weightedItem.content);
  });
});
