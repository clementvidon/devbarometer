import { describe, expect, test } from 'vitest';

import type { WeightedItem } from '../../entities';
import { normalizeByMean, type NormalizeByMeanParams } from './normalizeByMean';

/**
 * Spec: Normalize weights so that their mean equals target
 * - no items provided -> no items returned
 * - mean === 0 sets all weights to 0
 */

describe(normalizeByMean.name, () => {
  function makeWeightedItem(
    overrides: Partial<WeightedItem> = {},
  ): WeightedItem {
    return {
      sourceFetchRef: 'sourceFetchRef',
      itemRef: 'itemRef',
      title: 'title',
      content: 'content',
      score: 0,
      weight: 0,
      ...overrides,
    };
  }

  test('normalize weights so that their mean equals target', () => {
    const items = [
      makeWeightedItem({ weight: 1 }),
      makeWeightedItem({ weight: 1 }),
      makeWeightedItem({ weight: 4 }),
    ];
    const params: NormalizeByMeanParams = { target: 1 };

    const result = normalizeByMean(items, params);

    expect(result[0].weight).toBeCloseTo(0.5);
    expect(result[1].weight).toBeCloseTo(0.5);
    expect(result[2].weight).toBeCloseTo(2);
  });
  test('mean === 0 sets all weights to 0', () => {
    const items = [
      makeWeightedItem({ weight: 0 }),
      makeWeightedItem({ weight: 0 }),
      makeWeightedItem({ weight: 0 }),
    ];
    const params: NormalizeByMeanParams = { target: 1 };

    const result = normalizeByMean(items, params);

    result.forEach(({ weight }) => {
      expect(weight).toBe(0);
    });
  });
  test('no items provided -> no items returned', () => {
    const items: WeightedItem[] = [];
    const params: NormalizeByMeanParams = { target: 1 };

    const result = normalizeByMean(items, params);

    expect(result).toStrictEqual([]);
  });
});
