import { describe, expect, test } from 'vitest';

import { parseRelevance } from './parseRelevance';

/**
 * Spec: Parse relevance from LLM output.
 * - Accepts JSON with or without ``` fences.
 * - Returns true only for valid `{ relevant: true }`, otherwise false.
 * - Never throws.
 */

describe(parseRelevance.name, () => {
  test('returns FALLBACK on invalid JSON', () => {
    expect(parseRelevance('{ wrong }')).toMatchObject({
      ok: false,
      reason: 'invalid_json',
      value: false,
    });
  });
  test('returns FALLBACK on invalid schema', () => {
    expect(parseRelevance('{ "wrong": true }')).toMatchObject({
      ok: false,
      reason: 'invalid_schema',
      value: false,
    });
  });
  test('returns raw if valid (with code-fences)', () => {
    const obj = { relevant: true };
    const raw = '```\n' + JSON.stringify(obj) + '\n```';

    expect(parseRelevance(raw)).toMatchObject({
      ok: true,
      value: obj.relevant,
    });
  });
  test('returns raw if valid (with no code-fences)', () => {
    const obj = { relevant: false };
    const raw = JSON.stringify(obj);

    expect(parseRelevance(raw)).toMatchObject({
      ok: true,
      value: obj.relevant,
    });
  });
  test('returns FALLBACK on empty string', () => {
    expect(parseRelevance('')).toMatchObject({
      ok: false,
      reason: 'invalid_json',
      value: false,
    });
  });
});
