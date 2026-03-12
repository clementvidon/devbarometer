import {
  type TonalityScores,
  TonalityScoresSchema,
} from '@devbarometer/shared/domain';

import { fail, ok, type ParseResult } from '../../../lib/result/parseResult';
import { stripCodeFences } from '../../../lib/string/stripCodeFences';
import { FALLBACK_TONALITIES } from './policy';

export function parseTonality(raw: string): ParseResult<TonalityScores> {
  const cleaned = stripCodeFences(raw);
  let json: unknown;
  try {
    json = JSON.parse(cleaned);
  } catch {
    return fail(FALLBACK_TONALITIES, 'invalid_json');
  }
  const parsed = TonalityScoresSchema.safeParse(json);
  return parsed.success
    ? ok(parsed.data)
    : fail(FALLBACK_TONALITIES, 'invalid_schema');
}
