import { z } from 'zod';
import type { TonalityScores } from '../../core/entity/EmotionProfile';
import { stripCodeFences } from '../../lib/string/stripCodeFences';
import { FALLBACK_TONALITIES } from './policy';

const TonalitySchema = z.object({
  positive: z.number().min(0).max(1),
  negative: z.number().min(0).max(1),
  positive_surprise: z.number().min(0).max(1),
  negative_surprise: z.number().min(0).max(1),
  optimistic_anticipation: z.number().min(0).max(1),
  pessimistic_anticipation: z.number().min(0).max(1),
});

export function parseTonalityRaw(raw: string): TonalityScores {
  try {
    const cleaned = stripCodeFences(raw);
    const json: unknown = JSON.parse(cleaned);
    const parsed = TonalitySchema.safeParse(json);
    return parsed.success ? parsed.data : FALLBACK_TONALITIES;
  } catch {
    return FALLBACK_TONALITIES;
  }
}
