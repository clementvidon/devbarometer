import type { LlmRunOptions } from '../../core/port/LlmPort';

export const CONCURRENCY = 1;

export const DEFAULT_LLM_OPTIONS: LlmRunOptions & { model: string } = {
  model: 'gpt-5-chat-latest',
  temperature: 0.1,
  maxOutputTokens: 300,
  topP: 0.1,
  frequencyPenalty: 0.1,
  responseFormat: { type: 'json_object' } as const,
};

export const FALLBACK_EMOTIONS = {
  joy: 0,
  trust: 0,
  anger: 0,
  fear: 0,
  sadness: 0,
  disgust: 0,
} as const;

export const FALLBACK_TONALITIES = {
  positive: 0,
  negative: 0,
  positive_surprise: 0,
  negative_surprise: 0,
  optimistic_anticipation: 0,
  pessimistic_anticipation: 0,
} as const;
