import type { EmotionScores } from '@devbarometer/shared';
import { describe, expect, test } from 'vitest';
import { parseEmotionRaw } from './parseEmotion';
import { FALLBACK_EMOTIONS } from './policy';

/**
 * Spec: Parse emotion LLM output
 *
 * Inputs:
 * - a raw string
 *
 * Output:
 * - an object: EmotionScores if valid, otherwise a FALLBACK_EMOTIONS
 *
 * Behavior:
 * - validate parsed JSON against EmotionScores
 * - if validation succeeds, return the EmotionScores object
 * - if JSON parsing fails, return the FALLBACK_EMOTIONS object
 * - if schema validation fails, return FALLBACK_EMOTIONS
 *
 * Invariants:
 * - always return a EmotionScores object
 */

function makeEmotionScores(
  overrides: Partial<EmotionScores> = {},
): EmotionScores {
  return {
    joy: 1,
    trust: 1,
    anger: 1,
    fear: 1,
    sadness: 1,
    disgust: 1,
    ...overrides,
  };
}

describe('parseEmotionRaw', () => {
  test('return fallback if raw does not parse to JSON', () => {
    expect(parseEmotionRaw('{ wrong }')).toBe(FALLBACK_EMOTIONS);
  });
  test('return fallback if raw does not parse to EmotionScores', () => {
    expect(parseEmotionRaw('{ "wrong": true }')).toBe(FALLBACK_EMOTIONS);
  });
  test('return raw as an EmotionScores if it is valid, with code-fences', () => {
    const obj = makeEmotionScores({ trust: 0.42 });
    const raw = '```\n' + JSON.stringify(obj) + '\n```';

    const result = parseEmotionRaw(raw);

    expect(result).toStrictEqual(obj);
    expect(result).not.toStrictEqual(FALLBACK_EMOTIONS);
  });
  test('return raw as an EmotionScores if it is valid, without code-fences', () => {
    const obj = makeEmotionScores({ fear: 0.24 });
    const raw = JSON.stringify(obj);

    const result = parseEmotionRaw(raw);

    expect(result).toStrictEqual(obj);
    expect(result).not.toStrictEqual(FALLBACK_EMOTIONS);
  });
  test('return fallback for empty string', () => {
    expect(parseEmotionRaw('')).toBe(FALLBACK_EMOTIONS);
  });
});
