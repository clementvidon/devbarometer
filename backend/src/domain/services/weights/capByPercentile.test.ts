import { describe, expect, test } from 'vitest';
import type { WeightedItem } from '../../entities';
import { capByPercentile, type CapOptions } from './capByPercentile';

/**
 * Cap excessive weights based on percentile of excess over a base.
 * - Returns capped items and metadata explaining whether and why capping happened.
 * - If percentile interpolation cannot produce a finite value (edge cases),
 *   fallbacks to the largest observed excess (i.e. max(excess)).
 */

describe(capByPercentile.name, () => {
  const CAP_OPTS: CapOptions = {
    minN: 5,
    percentile: 0.95,
    percentileSmallN: 0.9,
    baseWeight: 1,
    concentrationGate: 0.35,
  };

  function makeWeightedItem(
    overrides: Partial<WeightedItem> = {},
  ): WeightedItem {
    return {
      source: 'source',
      title: 'title',
      content: 'content',
      score: 0,
      weight: 0,
      ...overrides,
    };
  }

  describe('main path', () => {
    test('caps weights using p95 percentile', () => {
      const items = [
        makeWeightedItem({ weight: 1 }),
        makeWeightedItem({ weight: 2 }),
        makeWeightedItem({ weight: 1 }),
        makeWeightedItem({ weight: 2 }),
        makeWeightedItem({ weight: 10 }),
      ];

      const result = capByPercentile(items, CAP_OPTS);

      expect(result.meta.capped).toStrictEqual(true);
      expect(result.meta.reason).toStrictEqual('p95_cap');
      expect(result.meta.usedPercentile).toStrictEqual(0.95);
      result.cappedItems.forEach((it, i) => {
        expect(it.weight).toBeLessThanOrEqual(items[i].weight);
      });
      expect(
        result.cappedItems.some((it, i) => it.weight < items[i].weight),
      ).toBe(true);
    });
  });

  describe('variants', () => {
    test('uses p90 when N < minN', () => {
      const items = [
        makeWeightedItem({ weight: 1 }),
        makeWeightedItem({ weight: 2 }),
        makeWeightedItem({ weight: 10 }),
      ];

      const result = capByPercentile(items, CAP_OPTS);

      expect(result.meta.capped).toStrictEqual(true);
      expect(result.meta.reason).toStrictEqual('p90_cap_smallN');
      expect(result.meta.usedPercentile).toStrictEqual(0.9);
      result.cappedItems.forEach((it, i) => {
        expect(it.weight).toBeLessThanOrEqual(items[i].weight);
      });
      expect(
        result.cappedItems.some((it, i) => it.weight < items[i].weight),
      ).toBe(true);
    });
  });

  describe('early exits', () => {
    test('returns unchanged when no excess', () => {
      const items = [
        makeWeightedItem({ weight: 0 }),
        makeWeightedItem({ weight: 0 }),
        makeWeightedItem({ weight: 0 }),
        makeWeightedItem({ weight: 0 }),
        makeWeightedItem({ weight: 0 }),
      ];

      const result = capByPercentile(items, CAP_OPTS);

      expect(result.meta.capped).toStrictEqual(false);
      expect(result.meta.reason).toStrictEqual('no_excess');
      expect(result.meta).not.toHaveProperty('usedPercentile');
      expect(result.meta.topShare).toBe(0);
      result.cappedItems.forEach((it, i) => {
        expect(it.weight).toBeLessThanOrEqual(items[i].weight);
      });
      expect(
        result.cappedItems.some((it, i) => it.weight < items[i].weight),
      ).toBe(false);
    });
    test('returns unchanged when concentration is low', () => {
      const items = [
        makeWeightedItem({ weight: 2 }),
        makeWeightedItem({ weight: 2 }),
        makeWeightedItem({ weight: 2 }),
        makeWeightedItem({ weight: 2 }),
        makeWeightedItem({ weight: 2 }),
      ];

      const result = capByPercentile(items, CAP_OPTS);

      expect(result.meta.capped).toStrictEqual(false);
      expect(result.meta.reason).toStrictEqual('low_concentration');
      expect(result.meta).not.toHaveProperty('usedPercentile');
      expect(result.meta.topShare).toBeLessThan(CAP_OPTS.concentrationGate);
      result.cappedItems.forEach((it, i) => {
        expect(it.weight).toBeLessThanOrEqual(items[i].weight);
      });
      expect(
        result.cappedItems.some((it, i) => it.weight < items[i].weight),
      ).toBe(false);
    });
  });

  describe('edge cases', () => {
    test('handles non-finite weights safely', () => {
      const items = [
        makeWeightedItem({ weight: Number.NaN }),
        makeWeightedItem({ weight: Number.POSITIVE_INFINITY }),
        makeWeightedItem({ weight: 10 }),
      ];
      const opts = {
        ...CAP_OPTS,
        minN: 1,
        concentrationGate: 0,
      };

      const result = capByPercentile(items, opts);

      expect(result.meta.capped).toStrictEqual(true);
      expect(result.meta.reason).toStrictEqual('p95_cap');
      result.cappedItems.forEach((it, i) => {
        if (Number.isFinite(items[i].weight)) {
          expect(it.weight).toBeLessThanOrEqual(items[i].weight);
        }
      });
      result.cappedItems.forEach((it) => {
        expect(Number.isFinite(it.weight)).toBe(true);
      });
      expect(result.meta.N).toBe(items.length);
    });
    test('treats non-finite percentile as 0', () => {
      const items = [
        makeWeightedItem({ weight: 1 }),
        makeWeightedItem({ weight: 2 }),
        makeWeightedItem({ weight: 1 }),
        makeWeightedItem({ weight: 2 }),
        makeWeightedItem({ weight: 10 }),
      ];

      const opts: CapOptions = {
        ...CAP_OPTS,
        minN: 1,
        percentile: Number.NaN,
        concentrationGate: 0,
      };

      const result = capByPercentile(items, opts);

      expect(result.meta.capped).toBe(true);
      expect(result.meta.reason).toBe('p95_cap');
      expect(result.meta.usedPercentile).toBe(NaN);
      expect(result.meta.capValue).toBeCloseTo(1);
    });
  });
});
