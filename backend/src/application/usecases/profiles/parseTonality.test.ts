import type { TonalityScores } from '@devbarometer/shared/domain';
import { describe, expect, test } from 'vitest';
import { parseTonality } from './parseTonality';
import { FALLBACK_TONALITIES } from './policy';

function makeTonalityScores(
  overrides: Partial<TonalityScores> = {},
): TonalityScores {
  return {
    positive: 1,
    negative: 1,
    positive_surprise: 1,
    negative_surprise: 1,
    optimistic_anticipation: 1,
    pessimistic_anticipation: 1,
    ...overrides,
  };
}

/**
 * Spec: Parse TonalityScores from LLM output.
 * - Accepts JSON with or without ``` fences.
 * - Returns validated TonalityScores, otherwise FALLBACK_TONALITIES.
 * - Never throws.
 */

describe(parseTonality.name, () => {
  test('returns FALLBACK on invalid JSON', () => {
    expect(parseTonality('{ wrong }')).toMatchObject({
      ok: false,
      reason: 'invalid_json',
      value: FALLBACK_TONALITIES,
    });
  });
  test('returns FALLBACK on invalid schema', () => {
    expect(parseTonality('{ "wrong": true }')).toMatchObject({
      ok: false,
      reason: 'invalid_schema',
      value: FALLBACK_TONALITIES,
    });
  });
  test('returns raw if valid (with code-fences)', () => {
    const obj = makeTonalityScores({ positive: 0.42 });
    const raw = '```\n' + JSON.stringify(obj) + '\n```';

    expect(parseTonality(raw)).toMatchObject({
      ok: true,
      value: obj,
    });
  });
  test('returns raw if valid (with no code-fences)', () => {
    const obj = makeTonalityScores({ negative: 0.24 });
    const raw = JSON.stringify(obj);

    expect(parseTonality(raw)).toMatchObject({
      ok: true,
      value: obj,
    });
  });
  test('returns FALLBACK on empty string', () => {
    expect(parseTonality('')).toMatchObject({
      ok: false,
      reason: 'invalid_json',
      value: FALLBACK_TONALITIES,
    });
  });
});
