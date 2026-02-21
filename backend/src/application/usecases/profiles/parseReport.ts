import { WEATHER_EMOJIS } from '@devbarometer/shared';
import { z } from 'zod';
import type { Report } from '../../../domain/entities';
import { stripCodeFences } from '../../../lib/string/stripCodeFences';
import { FALLBACK_REPORT } from './policy';

const LLMOutputSchema = z.object({
  text: z.string().max(200),
  emoji: z.enum(WEATHER_EMOJIS),
});

export function parseReportRaw(raw: string): Report {
  try {
    const cleaned = stripCodeFences(raw);
    const json: unknown = JSON.parse(cleaned);
    const parsed = LLMOutputSchema.safeParse(json);
    return parsed.success ? parsed.data : FALLBACK_REPORT;
  } catch {
    return FALLBACK_REPORT;
  }
}
