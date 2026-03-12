import {
  type Report,
  ReportSchema as ReportOutputSchema,
} from '@devbarometer/shared/domain';

import { fail, ok, type ParseResult } from '../../../lib/result/parseResult';
import { stripCodeFences } from '../../../lib/string/stripCodeFences';
import { FALLBACK_REPORT } from '../report/policy';

export function parseReport(raw: string): ParseResult<Report> {
  const cleaned = stripCodeFences(raw);
  let json: unknown;
  try {
    json = JSON.parse(cleaned);
  } catch {
    return fail(FALLBACK_REPORT, 'invalid_json');
  }
  const parsed = ReportOutputSchema.safeParse(json);
  return parsed.success
    ? ok(parsed.data)
    : fail(FALLBACK_REPORT, 'invalid_schema');
}
