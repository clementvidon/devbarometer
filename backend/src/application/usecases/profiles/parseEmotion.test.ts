import type { EmotionScores } from '@devbarometer/shared';
import { describe, expect, test } from 'vitest';
import { parseEmotion } from './parseEmotion';
import { FALLBACK_EMOTIONS } from './policy';

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

/**
 * Spec: Parse EmotionScores from LLM output.
 * - Accepts JSON with or without ``` fences.
 * - Returns validated EmotionScores, otherwise FALLBACK_EMOTIONS.
 * - Never throws.
 */

describe(parseEmotion.name, () => {
  test('return fallback if raw does not parse to JSON', () => {
    expect(parseEmotion('{ wrong }')).toBe(FALLBACK_EMOTIONS);
  });
  test('return fallback if raw does not parse to EmotionScores', () => {
    expect(parseEmotion('{ "wrong": true }')).toBe(FALLBACK_EMOTIONS);
  });
  test('return raw as an EmotionScores if it is valid, with code-fences', () => {
    const obj = makeEmotionScores({ trust: 0.42 });
    const raw = '```\n' + JSON.stringify(obj) + '\n```';

    const result = parseEmotion(raw);

    expect(result).toStrictEqual(obj);
    expect(result).not.toStrictEqual(FALLBACK_EMOTIONS);
  });
  test('return raw as an EmotionScores if it is valid, without code-fences', () => {
    const obj = makeEmotionScores({ fear: 0.24 });
    const raw = JSON.stringify(obj);

    const result = parseEmotion(raw);

    expect(result).toStrictEqual(obj);
    expect(result).not.toStrictEqual(FALLBACK_EMOTIONS);
  });
  test('return fallback for empty string', () => {
    expect(parseEmotion('')).toBe(FALLBACK_EMOTIONS);
  });
});
