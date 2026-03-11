import type { TonalityScores } from '@devbarometer/shared';
import { z } from 'zod';
import { fail, ok, type ParseResult } from '../../../lib/result/parseResult';
import { stripCodeFences } from '../../../lib/string/stripCodeFences';
import { FALLBACK_TONALITIES } from './policy';

const TonalityOutputSchema = z.object({
  positive: z.number().min(0).max(1),
  negative: z.number().min(0).max(1),
  positive_surprise: z.number().min(0).max(1),
  negative_surprise: z.number().min(0).max(1),
  optimistic_anticipation: z.number().min(0).max(1),
  pessimistic_anticipation: z.number().min(0).max(1),
});

export function parseTonality(raw: string): ParseResult<TonalityScores> {
  const cleaned = stripCodeFences(raw);
  let json: unknown;
  try {
    json = JSON.parse(cleaned);
  } catch {
    return fail(FALLBACK_TONALITIES, 'invalid_json');
  }
  const parsed = TonalityOutputSchema.safeParse(json);
  return parsed.success
    ? ok(parsed.data)
    : fail(FALLBACK_TONALITIES, 'invalid_schema');
}
