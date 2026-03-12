import {
  type EmotionScores,
  EmotionScoresSchema,
} from '@devbarometer/shared/domain';

import { fail, ok, type ParseResult } from '../../../lib/result/parseResult';
import { stripCodeFences } from '../../../lib/string/stripCodeFences';
import { FALLBACK_EMOTIONS } from './policy';

export function parseEmotion(raw: string): ParseResult<EmotionScores> {
  const cleaned = stripCodeFences(raw);
  let json: unknown;
  try {
    json = JSON.parse(cleaned);
  } catch {
    return fail(FALLBACK_EMOTIONS, 'invalid_json');
  }
  const parsed = EmotionScoresSchema.safeParse(json);
  return parsed.success
    ? ok(parsed.data)
    : fail(FALLBACK_EMOTIONS, 'invalid_schema');
}
