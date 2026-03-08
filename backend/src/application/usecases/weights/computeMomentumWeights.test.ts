import { describe, expect, test } from 'vitest';
import type { RelevantItem } from '../../../domain/entities';
import {
  computeMomentumWeights,
  DEFAULT_CAP_OPTIONS,
  DEFAULT_MOMENTUM_OPTIONS,
  DEFAULT_NORMALIZE_OPTIONS,
} from './computeMomentumWeights';

/**
 * Spec: Orchestrate momentum weights computation
 * - Applies the configured step toggles (momentum/cap/normalize).
 * - If momentum is disabled, assigns baseWeight to all items.
 * - Preserves input order and never mutates inputs.
 */

describe(computeMomentumWeights.name, () => {
  const BASE = DEFAULT_MOMENTUM_OPTIONS.baseWeight;
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
  test('momentum enabled, cap/normalize disabled', async () => {
    const prev = [
      makeRelevantItem({ source: 'increase', score: 2 }),
      makeRelevantItem({ source: 'decrease', score: 10 }),
      makeRelevantItem({ source: 'stable', score: 10 }),
    ];
    const items = [
      makeRelevantItem({ source: 'increase', score: 10 }),
      makeRelevantItem({ source: 'decrease', score: 2 }),
      makeRelevantItem({ source: 'stable', score: 10 }),
      makeRelevantItem({ source: 'new', score: 42 }),
    ];
    const opts = {
      momentum: { ...DEFAULT_MOMENTUM_OPTIONS, enabled: true },
      cap: { ...DEFAULT_CAP_OPTIONS, enabled: false },
      normalize: { ...DEFAULT_NORMALIZE_OPTIONS, enabled: false },
    };

    const result = await computeMomentumWeights(items, prev, opts);

    expect(result[0].weight).toBeGreaterThan(BASE);
    expect(result[1].weight).toBe(BASE);
    expect(result[2].weight).toBe(BASE);
    expect(result[3].weight).toBe(BASE);
    expect(result.map((it) => it.source)).toStrictEqual(
      items.map((it) => it.source),
    );
  });
  test('momentum disabled assigns baseWeight', async () => {
    const prev = [
      makeRelevantItem({ source: 'increase', score: 2 }),
      makeRelevantItem({ source: 'decrease', score: 10 }),
      makeRelevantItem({ source: 'stable', score: 10 }),
    ];
    const items = [
      makeRelevantItem({ source: 'increase', score: 10 }),
      makeRelevantItem({ source: 'decrease', score: 2 }),
      makeRelevantItem({ source: 'stable', score: 10 }),
      makeRelevantItem({ source: 'new', score: 42 }),
    ];
    const opts = {
      momentum: { ...DEFAULT_MOMENTUM_OPTIONS, enabled: false },
      cap: { ...DEFAULT_CAP_OPTIONS, enabled: false },
      normalize: { ...DEFAULT_NORMALIZE_OPTIONS, enabled: false },
    };

    const result = await computeMomentumWeights(items, prev, opts);

    expect(result.every((item) => item.weight === BASE)).toBe(true);
    expect(result.map((it) => it.source)).toStrictEqual(
      items.map((it) => it.source),
    );
  });
  test('all steps enabled: sanitizes non-finite scores', async () => {
    const prev = [
      makeRelevantItem({ source: 'increase', score: 2 }),
      makeRelevantItem({ source: 'stable', score: 10 }),
    ];
    const items = [
      makeRelevantItem({ source: 'increase', score: 10 }),
      makeRelevantItem({ source: 'stable', score: Number.NaN }),
      makeRelevantItem({ source: 'new', score: 42 }),
    ];

    const opts = {
      momentum: { ...DEFAULT_MOMENTUM_OPTIONS, enabled: true },
      cap: { ...DEFAULT_CAP_OPTIONS, enabled: true },
      normalize: { ...DEFAULT_NORMALIZE_OPTIONS, enabled: true },
    };

    const itemsBefore = structuredClone(items);
    const prevBefore = structuredClone(prev);

    const result = await computeMomentumWeights(items, prev, opts);

    expect(result.map((it) => it.source)).toStrictEqual(
      items.map((it) => it.source),
    );
    expect(result.every((it) => Number.isFinite(it.weight))).toBe(true);
    expect(items).toStrictEqual(itemsBefore);
    expect(prev).toStrictEqual(prevBefore);
  });
});
