import { z } from 'zod';

import { ItemRelevanceCategorySchema } from '../../../domain/entities';
import { fail, ok, type ParseResult } from '../../../lib/result/parseResult';
import { stripCodeFences } from '../../../lib/string/stripCodeFences';

const FALLBACK_PARSE_VALUE = {
  relevant: false,
  category: 'noise',
  topicScore: 0,
  emotionScore: 0,
  genreScore: 0,
} as const;

const RelevanceOutputSchema = z.object({
  relevant: z.boolean(),
  category: ItemRelevanceCategorySchema,
  topicScore: z.number().min(0).max(1),
  emotionScore: z.number().min(0).max(1),
  genreScore: z.number().min(0).max(1),
});

export type ParsedRelevance = z.infer<typeof RelevanceOutputSchema>;

export function parseRelevance(raw: string): ParseResult<ParsedRelevance> {
  const cleaned = stripCodeFences(raw);

  let json: unknown;
  try {
    json = JSON.parse(cleaned);
  } catch {
    return fail(FALLBACK_PARSE_VALUE, 'invalid_json');
  }
  const parsed = RelevanceOutputSchema.safeParse(json);
  return parsed.success
    ? ok(parsed.data)
    : fail(FALLBACK_PARSE_VALUE, 'invalid_schema');
}
