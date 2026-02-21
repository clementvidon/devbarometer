import { describe, expect, test } from 'vitest';
import type { WeightedItem } from '../../../domain/entities';
import { makeProfileMessages } from './llmMessages';

/**
 * Spec: Creates ordered LLM messages for the emotion profile creation
 *
 * Inputs:
 * - a weighted item
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

function makeWeightedItem(overrides: Partial<WeightedItem> = {}): WeightedItem {
  return {
    source: 'source',
    title: 'title',
    content: 'content',
    score: 0,
    weight: 0,
    ...overrides,
  };
}

describe('makeProfileMessages', () => {
  test('creates a system and user message for the emotion profile creation', () => {
    const weightedItem = makeWeightedItem({
      title: 'my-title',
      content: 'my-content',
    });
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
