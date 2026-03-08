import { describe, expect, test } from 'vitest';
import type { RelevantItem } from '../../entities/Item';
import { computeMomentum } from './computeMomentum';

/**
 * Spec: Compute momentum weights between today and yesterday items
 * - new item or non-positive delta -> baseWeight
 * - positive delta -> baseWeight + log1p(delta)
 * - no prev items -> all are treated as new
 */

describe(computeMomentum.name, () => {
  const BASE_WEIGHT = 10;
  function makeRelevantItem(
    overrides: Partial<RelevantItem> = {},
  ): RelevantItem {
    return {
      source: 'source',
      title: 'title',
      content: 'content',
      score: 0,
      ...overrides,
    };
  }
  test('new item or non-positive delta -> baseWeight', () => {
    const prev = [
      makeRelevantItem({ source: 'decrease', score: 4 }),
      makeRelevantItem({ source: 'stable', score: 2 }),
    ];
    const today = [
      makeRelevantItem({ source: 'decrease', score: 2 }),
      makeRelevantItem({ source: 'stable', score: 2 }),
      makeRelevantItem({ source: 'new', score: 10 }),
    ];
    const params = { baseWeight: BASE_WEIGHT };

    const result = computeMomentum(today, prev, params);

    expect(result).toHaveLength(today.length);
    result.forEach((item) => {
      expect(item.weight).toStrictEqual(BASE_WEIGHT);
    });
  });
  test('positive delta -> baseWeight + log1p(delta)', () => {
    const prev = [makeRelevantItem({ source: 'increase', score: 2 })];
    const today = [makeRelevantItem({ source: 'increase', score: 20 })];
    const params = { baseWeight: BASE_WEIGHT };
    const delta = today[0].score - prev[0].score;

    const result = computeMomentum(today, prev, params);

    result.forEach((item) => {
      expect(item.weight).toBeCloseTo(BASE_WEIGHT + Math.log1p(delta));
    });
  });
  test('no prev items -> all are treated as new', () => {
    const today = [makeRelevantItem({ source: 'a', score: 5 })];
    const params = { baseWeight: BASE_WEIGHT };

    const result = computeMomentum(today, [], params);

    expect(result[0].weight).toBe(BASE_WEIGHT);
  });
});
