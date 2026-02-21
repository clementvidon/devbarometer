import type { LlmRunOptions } from '../../ports/output/LlmPort';

export const CONCURRENCY = 1;

export const RELEVANCE_LLM_OPTIONS = {
  model: 'gpt-5-chat-latest',
  temperature: 0.1,
  maxOutputTokens: 300,
  topP: 0.1,
  presencePenalty: 0,
  frequencyPenalty: 0.2,
  responseFormat: { type: 'json_object' } as const,
} as const satisfies LlmRunOptions & { model: string };

export const DEFAULT_RELEVANCE_ON_ERROR = false;
