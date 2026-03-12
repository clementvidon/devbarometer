import type { LlmRunOptions } from '../../ports/output/LlmPort';

export const CONCURRENCY = 1;

export const RELEVANCE_LLM_OPTIONS = {
  model: 'gpt-5-mini',
  maxOutputTokens: 1000,
  reasoningEffort: 'low',
  responseFormat: { type: 'json_object' as const },
} satisfies LlmRunOptions & { model: string };

export const DEFAULT_RELEVANCE_ON_ERROR = false;
