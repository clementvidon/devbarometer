import { z } from 'zod';
import { fail, ok, type ParseResult } from '../../../lib/result/parseResult';
import { stripCodeFences } from '../../../lib/string/stripCodeFences';

const RelevanceSchema = z.object({ relevant: z.boolean() });

export function parseRelevance(raw: string): ParseResult<boolean> {
  const cleaned = stripCodeFences(raw);

  let json: unknown;
  try {
    json = JSON.parse(cleaned);
  } catch {
    return fail(false, 'invalid_json');
  }
  const parsed = RelevanceSchema.safeParse(json);
  return parsed.success
    ? ok(parsed.data.relevant)
    : fail(false, 'invalid_schema');
}
