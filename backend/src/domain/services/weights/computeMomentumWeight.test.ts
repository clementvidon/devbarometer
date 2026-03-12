import { describe, expect, test } from 'vitest';

import type { RelevantItem } from '../../entities/Item';
import { computeMomentumWeight } from './computeMomentumWeight';

/**
 * Spec: Compute momentum weights between today and yesterday items
 * - new item or non-positive delta -> baseWeight
 * - positive delta -> baseWeight + log1p(delta)
 * - no prev items -> all are treated as new
 */

describe(computeMomentumWeight.name, () => {
  const BASE_WEIGHT = 10;
  function makeRelevantItem(
    overrides: Partial<RelevantItem> = {},
  ): RelevantItem {
    return {
      sourceFetchRef: 'sourceFetchRef',
      itemRef: 'itemRef',
      title: 'title',
      content: 'content',
      score: 0,
      ...overrides,
    };
  }
  test('new item or non-positive delta -> baseWeight', () => {
    const prev = [
      makeRelevantItem({ itemRef: 'decrease', score: 4 }),
      makeRelevantItem({ itemRef: 'stable', score: 2 }),
    ];
    const today = [
      makeRelevantItem({ itemRef: 'decrease', score: 2 }),
      makeRelevantItem({ itemRef: 'stable', score: 2 }),
      makeRelevantItem({ itemRef: 'new', score: 10 }),
    ];
    const params = { baseWeight: BASE_WEIGHT };

    const result = computeMomentumWeight(today, prev, params);

    expect(result).toHaveLength(today.length);
    result.forEach((item) => {
      expect(item.weight).toStrictEqual(BASE_WEIGHT);
    });
  });
  test('positive delta -> baseWeight + log1p(delta)', () => {
    const prev = [makeRelevantItem({ itemRef: 'increase', score: 2 })];
    const today = [makeRelevantItem({ itemRef: 'increase', score: 20 })];
    const params = { baseWeight: BASE_WEIGHT };
    const delta = today[0].score - prev[0].score;

    const result = computeMomentumWeight(today, prev, params);

    result.forEach((item) => {
      expect(item.weight).toBeCloseTo(BASE_WEIGHT + Math.log1p(delta));
    });
  });
  test('no prev items -> all are treated as new', () => {
    const today = [makeRelevantItem({ itemRef: 'a', score: 5 })];
    const params = { baseWeight: BASE_WEIGHT };

    const result = computeMomentumWeight(today, [], params);

    expect(result[0].weight).toBe(BASE_WEIGHT);
  });
});
