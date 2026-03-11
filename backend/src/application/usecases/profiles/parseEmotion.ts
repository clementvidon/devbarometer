import type { EmotionScores } from '@devbarometer/shared/domain';
import { z } from 'zod';
import { fail, ok, type ParseResult } from '../../../lib/result/parseResult';
import { stripCodeFences } from '../../../lib/string/stripCodeFences';
import { FALLBACK_EMOTIONS } from './policy';

const EmotionOutputSchema = z.object({
  joy: z.number().min(0).max(1),
  trust: z.number().min(0).max(1),
  anger: z.number().min(0).max(1),
  fear: z.number().min(0).max(1),
  sadness: z.number().min(0).max(1),
  disgust: z.number().min(0).max(1),
});

export function parseEmotion(raw: string): ParseResult<EmotionScores> {
  const cleaned = stripCodeFences(raw);
  let json: unknown;
  try {
    json = JSON.parse(cleaned);
  } catch {
    return fail(FALLBACK_EMOTIONS, 'invalid_json');
  }
  const parsed = EmotionOutputSchema.safeParse(json);
  return parsed.success
    ? ok(parsed.data)
    : fail(FALLBACK_EMOTIONS, 'invalid_schema');
}
