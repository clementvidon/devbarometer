import { describe, expect, test } from 'vitest';
import type { RelevantItem } from '../../../domain/entities';
import { makeProfileMessages } from './llmMessages';

/**
 * Spec: Build ordered LLM messages to extract an emotion profile from a relevant item.
 * - Returns exactly 2 messages: system first, user second.
 * - Injects the system prompt as the system message content.
 * - Injects item title+content into the user message.
 */

describe(makeProfileMessages.name, () => {
  test('creates a system and user message for the emotion profile creation', () => {
    const item = {
      title: 'my-title',
      content: 'my-content',
    } as RelevantItem;
    const systemPrompt = 'my-system-prompt';

    const result = makeProfileMessages(item, systemPrompt);
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
