import type { TonalityScores } from '@devbarometer/shared';
import { describe, expect, test } from 'vitest';
import { parseTonalityRaw } from './parseTonality';
import { FALLBACK_TONALITIES } from './policy';

/**
 * Spec: Parse tonality LLM output
 *
 * Inputs:
 * - a raw string
 *
 * Output:
 * - an object: TonalityScores if valid, otherwise a FALLBACK_TONALITIES
 *
 * Behavior:
 * - validate parsed JSON against TonalityScores
 * - if validation succeeds, return the TonalityScores object
 * - if JSON parsing fails, return the FALLBACK_TONALITIES object
 * - if schema validation fails, return FALLBACK_TONALITIES
 *
 * Invariants:
 * - always return a TonalityScores object
 */

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

describe('parseTonalityRaw', () => {
  test('return fallback if raw does not parse to JSON', () => {
    expect(parseTonalityRaw('{ wrong }')).toBe(FALLBACK_TONALITIES);
  });
  test('return fallback if raw does not parse to TonalityScores', () => {
    expect(parseTonalityRaw('{ "wrong": true }')).toBe(FALLBACK_TONALITIES);
  });
  test('return raw as an TonalityScores if it is valid, with code-fences', () => {
    const obj = makeTonalityScores({ positive: 0.42 });
    const raw = '```\n' + JSON.stringify(obj) + '\n```';

    const result = parseTonalityRaw(raw);

    expect(result).toStrictEqual(obj);
    expect(result).not.toStrictEqual(FALLBACK_TONALITIES);
  });
  test('return raw as an TonalityScores if it is valid, without code-fences', () => {
    const obj = makeTonalityScores({ negative: 0.24 });
    const raw = JSON.stringify(obj);

    const result = parseTonalityRaw(raw);

    expect(result).toStrictEqual(obj);
    expect(result).not.toStrictEqual(FALLBACK_TONALITIES);
  });
  test('return fallback for empty string', () => {
    expect(parseTonalityRaw('')).toBe(FALLBACK_TONALITIES);
  });
});
