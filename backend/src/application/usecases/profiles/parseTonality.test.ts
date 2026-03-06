import type { TonalityScores } from '@devbarometer/shared';
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
  test('return fallback if raw does not parse to JSON', () => {
    expect(parseTonality('{ wrong }')).toBe(FALLBACK_TONALITIES);
  });
  test('return fallback if raw does not parse to TonalityScores', () => {
    expect(parseTonality('{ "wrong": true }')).toBe(FALLBACK_TONALITIES);
  });
  test('return raw as an TonalityScores if it is valid, with code-fences', () => {
    const obj = makeTonalityScores({ positive: 0.42 });
    const raw = '```\n' + JSON.stringify(obj) + '\n```';

    const result = parseTonality(raw);

    expect(result).toStrictEqual(obj);
    expect(result).not.toStrictEqual(FALLBACK_TONALITIES);
  });
  test('return raw as an TonalityScores if it is valid, without code-fences', () => {
    const obj = makeTonalityScores({ negative: 0.24 });
    const raw = JSON.stringify(obj);

    const result = parseTonality(raw);

    expect(result).toStrictEqual(obj);
    expect(result).not.toStrictEqual(FALLBACK_TONALITIES);
  });
  test('return fallback for empty string', () => {
    expect(parseTonality('')).toBe(FALLBACK_TONALITIES);
  });
});
