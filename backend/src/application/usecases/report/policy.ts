import type { Report } from '@devbarometer/shared/domain';

import type { LlmRunOptions } from '../../ports/output/LlmPort';

export const REPORT_LLM_OPTIONS = {
  model: 'gpt-5-mini',
  maxOutputTokens: 400,
  reasoningEffort: 'minimal',
  responseFormat: { type: 'json_object' as const },
} satisfies LlmRunOptions & { model: string };

export const FALLBACK_REPORT = {
  text: '',
  emoji: '☁️',
} satisfies Report;
