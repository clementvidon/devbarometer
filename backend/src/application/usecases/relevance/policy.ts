import type { ItemRelevance } from '../../../domain/entities';
import type { LlmRunOptions } from '../../ports/output/LlmPort';

export const CONCURRENCY = 1;

export const RELEVANCE_LLM_OPTIONS = {
  model: 'gpt-5-chat-latest',
  temperature: 0.1,
  topP: 0.1,
  maxOutputTokens: 80,
  responseFormat: { type: 'json_object' as const },
} satisfies LlmRunOptions & { model: string };

export const DEFAULT_RELEVANCE_ON_ERROR = false;

export const FALLBACK_ITEM_RELEVANCE = {
  relevant: false,
  category: 'noise',
  topicScore: 0,
  emotionScore: 0,
  genreScore: 0,
} as const satisfies Omit<ItemRelevance, 'itemRef'>;
