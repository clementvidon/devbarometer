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
  test('returns FALLBACK on invalid JSON', () => {
    expect(parseEmotion('{ wrong }')).toMatchObject({
      ok: false,
      reason: 'invalid_json',
      value: FALLBACK_EMOTIONS,
    });
  });
  test('returns FALLBACK on invalid schema', () => {
    expect(parseEmotion('{ "wrong": true }')).toMatchObject({
      ok: false,
      reason: 'invalid_schema',
      value: FALLBACK_EMOTIONS,
    });
  });
  test('returns raw if valid (with code-fences)', () => {
    const obj = makeEmotionScores({ trust: 0.42 });
    const raw = '```\n' + JSON.stringify(obj) + '\n```';

    expect(parseEmotion(raw)).toMatchObject({
      ok: true,
      value: obj,
    });
  });
  test('returns raw if valid (with no code-fences)', () => {
    const obj = makeEmotionScores({ fear: 0.24 });
    const raw = JSON.stringify(obj);

    expect(parseEmotion(raw)).toMatchObject({
      ok: true,
      value: obj,
    });
  });
  test('returns FALLBACK on empty string', () => {
    expect(parseEmotion('')).toMatchObject({
      ok: false,
      reason: 'invalid_json',
      value: FALLBACK_EMOTIONS,
    });
  });
});
