import type { Report } from '@devbarometer/shared/domain';

import type { LlmRunOptions } from '../../ports/output/LlmPort';

export const REPORT_LLM_OPTIONS = {
  model: 'gpt-5-chat-latest',
  temperature: 0.4,
  maxOutputTokens: 100,
  topP: 0.9,
  frequencyPenalty: 0.2,
  responseFormat: { type: 'json_object' as const },
} satisfies LlmRunOptions & { model: string };

export const FALLBACK_REPORT = {
  text: '',
  emoji: '☁️',
} satisfies Report;
