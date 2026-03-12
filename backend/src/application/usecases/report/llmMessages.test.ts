import { describe, expect, test } from 'vitest';

import { makeReportMessages } from './llmMessages';
import type { SentimentProfileSummary } from './summarizeProfile';

/**
 * Spec: Build ordered LLM messages to generate a report from an sentiment profile summary.
 * - Returns exactly 2 messages: system first, user second.
 * - Injects the system prompt as the system message content.
 * - Injects the JSON summary into the user message content.
 */

describe(makeReportMessages.name, () => {
  test('create a system and user message for the report generation', () => {
    const summary = {
      emotionsStrength: [],
      tonalitiesStrength: [],
      standoutEmotions: [],
    } as SentimentProfileSummary;
    const systemPrompt = 'my-system-prompt';

    const result = makeReportMessages(summary, systemPrompt);
    const [systemMessage, userMessage] = result;

    expect(result).toHaveLength(2);
    expect(systemMessage).toEqual({
      role: 'system',
      content: systemPrompt,
    });
    expect(userMessage.role).toBe('user');
    expect(userMessage.content).toContain(JSON.stringify(summary));
  });
});
