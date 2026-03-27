import { describe, expect, test } from 'vitest';

import { parseRelevance } from './parseRelevance';

/**
 * Spec: Parse relevance from LLM output.
 * - Accepts JSON with or without ``` fences.
 * - Returns true only for valid `{ relevant: true }`, otherwise false.
 * - Never throws.
 */

describe('parseRelevance', () => {
  test('returns FALLBACK on invalid JSON', () => {
    expect(parseRelevance('{ wrong }')).toMatchObject({
      ok: false,
      reason: 'invalid_json',
      value: {
        relevant: false,
        category: 'noise',
        topicScore: 0,
        emotionScore: 0,
        genreScore: 0,
      },
    });
  });
  test('returns FALLBACK on invalid schema', () => {
    expect(parseRelevance('{ "wrong": true }')).toMatchObject({
      ok: false,
      reason: 'invalid_schema',
      value: {
        relevant: false,
        category: 'noise',
        topicScore: 0,
        emotionScore: 0,
        genreScore: 0,
      },
    });
  });
  test('returns raw if valid (with code-fences)', () => {
    const obj = {
      relevant: true,
      category: 'emotional_insight',
      topicScore: 0.9,
      emotionScore: 0.8,
      genreScore: 0.95,
    };
    const raw = '```\n' + JSON.stringify(obj) + '\n```';

    expect(parseRelevance(raw)).toMatchObject({
      ok: true,
      value: obj,
    });
  });
  test('returns raw if valid (with no code-fences)', () => {
    const obj = {
      relevant: false,
      category: 'factual_insight',
      topicScore: 0.8,
      emotionScore: 0.1,
      genreScore: 0.8,
    };
    const raw = JSON.stringify(obj);

    expect(parseRelevance(raw)).toMatchObject({
      ok: true,
      value: obj,
    });
  });
  test('returns FALLBACK on empty string', () => {
    expect(parseRelevance('')).toMatchObject({
      ok: false,
      reason: 'invalid_json',
      value: {
        relevant: false,
        category: 'noise',
        topicScore: 0,
        emotionScore: 0,
        genreScore: 0,
      },
    });
  });
});
