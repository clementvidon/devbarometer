import { describe, expect, test } from 'vitest';

import type { Item } from '../../../domain/entities';
import { makeRelevanceMessages } from './llmMessages';

/**
 * Spec: Build ordered LLM messages to classify an item as relevant or not.
 * - Returns exactly 2 messages: system first, user second.
 * - Injects the system prompt as the system message content.
 * - Injects item title+content into the user message.
 */

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
