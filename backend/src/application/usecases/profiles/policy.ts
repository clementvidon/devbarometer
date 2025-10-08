import type { EmotionScores, TonalityScores } from '../../../domain/entities';
import type { LlmRunOptions } from '../../ports/LlmPort';

export const CONCURRENCY = 1;

export const DEFAULT_LLM_OPTIONS = {
  model: 'gpt-5-chat-latest',
  temperature: 0.1,
  maxOutputTokens: 300,
  topP: 0.1,
  frequencyPenalty: 0.1,
  responseFormat: { type: 'json_object' } as const,
} as const satisfies LlmRunOptions & { model: string };

export const FALLBACK_EMOTIONS = {
  anger: 0,
  fear: 0,
  trust: 0,
  sadness: 0,
  joy: 0,
  disgust: 0,
} as const satisfies EmotionScores;

export const FALLBACK_TONALITIES = {
  positive: 0,
  negative: 0,
  optimistic_anticipation: 0,
  pessimistic_anticipation: 0,
  positive_surprise: 0,
  negative_surprise: 0,
} as const satisfies TonalityScores;
