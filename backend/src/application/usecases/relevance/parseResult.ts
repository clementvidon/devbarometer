import { z } from 'zod';
import { stripCodeFences } from '../../../lib/string/stripCodeFences';

const RelevanceSchema = z.object({ relevant: z.boolean() });

export function parseRelevanceResult(raw: string): boolean {
  try {
    const cleaned = stripCodeFences(raw);
    const json: unknown = JSON.parse(cleaned);
    const parsed = RelevanceSchema.safeParse(json);
    return parsed.success ? parsed.data.relevant : false;
  } catch {
    return false;
  }
}
