import { describe, expect, test } from 'vitest';

import type { RelevantItem } from '../../entities/Item';
import { sanitizeMomentumInputs } from './sanitizeMomentumInputs';

/**
 * Spec: Sanitize score fields for current and previous items
 * - Replaces non-finite values (NaN, Infinity, -Infinity) with 0.
 * - Returns sanitized copies of both arrays. No logging in domain layer.
 */

describe(sanitizeMomentumInputs.name, () => {
  function makeRelevantItem(
    overrides: Partial<RelevantItem> = {},
  ): RelevantItem {
    return {
      sourceFetchRef: 'sourceFetchRef',
      itemRef: 'itemRef',
      title: 'title',
      content: 'content',
      score: 1,
      ...overrides,
    };
  }
  test('replaces non-finite values with 0', () => {
    const NON_FINITE_VALUES: Record<string, number> = {
      nan: NaN,
      infinityPos: Infinity,
      infinityNeg: -Infinity,
    };
    const items = [makeRelevantItem({ score: NON_FINITE_VALUES.nan })];
    const prevItems = [
      makeRelevantItem({ score: NON_FINITE_VALUES.infinityPos }),
      makeRelevantItem({ score: NON_FINITE_VALUES.infinityNeg }),
    ];

    const { safeItems, safePrevItems } = sanitizeMomentumInputs(
      items,
      prevItems,
    );

    safeItems.forEach((item) => {
      expect(item.score).toStrictEqual(0);
    });
    safePrevItems.forEach((item) => {
      expect(item.score).toStrictEqual(0);
    });
  });
  test('preserve finite values', () => {
    const items = [
      makeRelevantItem({ score: 0 }),
      makeRelevantItem({ score: 1 }),
    ];
    const prevItems = [
      makeRelevantItem({ score: 10 }),
      makeRelevantItem({ score: -10 }),
    ];

    const { safeItems, safePrevItems } = sanitizeMomentumInputs(
      items,
      prevItems,
    );

    safeItems.forEach((item, i) => {
      expect(item).toStrictEqual(items[i]);
    });
    safePrevItems.forEach((item, i) => {
      expect(item).toStrictEqual(prevItems[i]);
    });
  });
  test('empty arrays returns empty arrays', () => {
    const items = [] as RelevantItem[];
    const prevItems = [] as RelevantItem[];

    const { safeItems, safePrevItems } = sanitizeMomentumInputs(
      items,
      prevItems,
    );

    expect(safeItems).toHaveLength(0);
    expect(safePrevItems).toHaveLength(0);
  });
});
