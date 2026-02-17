import { describe, expect, test } from 'vitest';
import { parseRelevanceResult } from './parseResult';

/**
 * Spec: Parse relevant result
 *
 * Inputs:
 * - a raw string
 *
 * Output:
 * - true only if raw contains valid JSON matching RelevanceSchema with relevant: true
 * - otherwise false
 *
 * Behavior:
 * - remove code-fences from the raw string
 * - parse cleaned string as JSON
 * - validate parsed JSON against RelevanceSchema
 * - if validation succeeds, return the value of relevant
 * - if JSON parsing fails, return false
 * - if schema validation fails, return false
 *
 * Invariants:
 * - always return a boolean
 */

describe('parseRelevanceResult', () => {
  test('return false if raw does not parse to JSON', () => {
    expect(parseRelevanceResult('{ wrong }')).toBe(false);
  });
  test('return false if raw does not parse to RelevanceSchema', () => {
    expect(parseRelevanceResult('{ "wrong": true }')).toBe(false);
  });
  test('returns true when relevant is true with code-fences', () => {
    expect(parseRelevanceResult('```\n{ "relevant": true }\n```')).toBe(true);
  });
  test('returns true when relevant is true without code-fences', () => {
    expect(parseRelevanceResult('{ "relevant": true }')).toBe(true);
  });
  test('returns false when relevant is false', () => {
    expect(parseRelevanceResult('{ "relevant": false }')).toBe(false);
  });
  test('returns false for empty string', () => {
    expect(parseRelevanceResult('')).toBe(false);
  });
});
