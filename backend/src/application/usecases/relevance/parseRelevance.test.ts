import { describe, expect, test } from 'vitest';
import { parseRelevance } from './parseRelevance';

/**
 * Spec: Parse relevance LLM output
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

describe(parseRelevance.name, () => {
  test('return false if raw does not parse to JSON', () => {
    expect(parseRelevance('{ wrong }')).toBe(false);
  });
  test('return false if raw does not parse to RelevanceSchema', () => {
    expect(parseRelevance('{ "wrong": true }')).toBe(false);
  });
  test('return true when relevant is true with code-fences', () => {
    expect(parseRelevance('```\n{ "relevant": true }\n```')).toBe(true);
  });
  test('return true when relevant is true without code-fences', () => {
    expect(parseRelevance('{ "relevant": true }')).toBe(true);
  });
  test('return false when relevant is false', () => {
    expect(parseRelevance('{ "relevant": false }')).toBe(false);
  });
  test('return false for empty string', () => {
    expect(parseRelevance('')).toBe(false);
  });
});
