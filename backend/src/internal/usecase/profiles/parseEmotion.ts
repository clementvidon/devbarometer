import { z } from 'zod';
import type { EmotionScores } from '../../core/entity/EmotionProfile';
import { stripCodeFences } from '../../lib/string/stripCodeFences';
import { FALLBACK_EMOTIONS } from './policy';

const EmotionSchema = z.object({
  joy: z.number().min(0).max(1),
  trust: z.number().min(0).max(1),
  anger: z.number().min(0).max(1),
  fear: z.number().min(0).max(1),
  sadness: z.number().min(0).max(1),
  disgust: z.number().min(0).max(1),
});

export function parseEmotionRaw(raw: string): EmotionScores {
  try {
    const cleaned = stripCodeFences(raw);
    const json: unknown = JSON.parse(cleaned);
    const parsed = EmotionSchema.safeParse(json);
    return parsed.success ? parsed.data : FALLBACK_EMOTIONS;
  } catch {
    return FALLBACK_EMOTIONS;
  }
}
