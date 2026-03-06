import { describe, expect, test } from 'vitest';
import { parseRelevance } from './parseRelevance';

/**
 * Spec: Parse relevance from an LLM raw string.
 * - Accepts JSON with or without ``` fences.
 * - Returns true only for `{ relevant: true }`, otherwise false.
 * - Never throws.
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
