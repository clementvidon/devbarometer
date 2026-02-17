import { describe, expect, test } from 'vitest';
import type { Item } from '../../../domain/entities';
import { makeRelevanceMessages } from './messages';

/**
 * Spec: Creates ordered LLM messages for the relevance filter
 *
 * Inputs:
 * - an item
 * - a system prompt
 *
 * Output:
 * - an array of LlmMessage:
 *
 * Behavior:
 * - injects the system prompt into the system message
 * - injects the item title and content into the user message
 *
 * Invariants:
 * - returns exactly 2 messages
 * - system message is first
 * - user message is second
 */

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    source: 'source',
    title: 'title',
    content: 'content',
    score: 0,
    ...overrides,
  };
}

describe('makeRelevanceMessages', () => {
  test('creates a system and user message for the relevance filter', () => {
    const item = makeItem({
      title: 'my-title',
      content: 'my-content',
    });
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
