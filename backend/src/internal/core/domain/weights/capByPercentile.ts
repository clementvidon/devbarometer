import type { WeightedItem } from '../../entity';
import type { CapOptions } from './MomentumWeightsStrategy';

export type WeightsCapReason =
  | 'no_excess'
  | 'low_concentration'
  | 'p90_cap_smallN'
  | 'p95_cap';

export type WeightsCapMeta = {
  capped: boolean;
  reason?: WeightsCapReason;
  capValue?: number;
  usedPercentile?: number;
  topShare: number;
  N: number;
};

const sortAsc = (arr: number[]) => [...arr].sort((a, b) => a - b);

function percentileInterpolated(values: number[], p: number): number {
  if (!Array.isArray(values) || values.length === 0) return NaN;
  const s = sortAsc(values.filter((v) => Number.isFinite(v)));
  if (s.length === 0) return NaN;
  if (s.length === 1) return s[0];

  const pct = Number.isFinite(p) ? Math.max(0, Math.min(1, p)) : 0;
  const h = (s.length - 1) * pct;
  const i = Math.floor(h);
  const j = Math.min(i + 1, s.length - 1);
  const w = h - i;
  return s[i] + w * (s[j] - s[i]);
}

function computeExcess(items: WeightedItem[], base: number) {
  const weights = items.map((i) => (Number.isFinite(i.weight) ? i.weight : 0));
  const excess = weights.map((w) => Math.max(0, w - base));
  const sumExcess = excess.reduce((a, b) => a + b, 0);
  return { excess, sumExcess };
}

function computeTopShare(excess: number[], sumExcess: number) {
  return sumExcess > 0 ? Math.max(...excess) / sumExcess : 0;
}

function applyCap(
  items: WeightedItem[],
  excess: number[],
  cap: number,
  base: number,
): WeightedItem[] {
  return items.map((it, k) => ({
    ...it,
    weight: base + Math.min(excess[k], cap),
  }));
}

/**
 * Cap excessive weights based on percentile of excess over a base.
 * Returns capped items and metadata explaining whether and why capping happened.
 * Input arrays are not mutated.
 *
 * Fallback policy:
 * - If percentile interpolation cannot produce a finite value (edge cases),
 *   we fallback to using the largest observed excess (i.e. max(excess)).
 */
export function capByPercentile(
  items: WeightedItem[],
  opts: CapOptions,
): { cappedItems: WeightedItem[]; meta: WeightsCapMeta } {
  const { minN, percentile, percentileSmallN, baseWeight, concentrationGate } =
    opts;

  const N = items.length;
  const { excess, sumExcess } = computeExcess(items, baseWeight);

  // Small tolerance to treat sums extremely close to zero as zero.
  const EPS = Number.EPSILON * 100;
  if (sumExcess <= EPS) {
    return {
      cappedItems: [...items],
      meta: { capped: false, reason: 'no_excess', topShare: 0, N },
    };
  }

  const topShare = computeTopShare(excess, sumExcess);
  if (topShare < concentrationGate) {
    return {
      cappedItems: [...items],
      meta: { capped: false, reason: 'low_concentration', topShare, N },
    };
  }

  const nonZero = excess.filter((x) => x > 0);
  const isSmallN = N < minN;
  const usedPercentile = isSmallN ? percentileSmallN : percentile;
  const reason = isSmallN ? 'p90_cap_smallN' : 'p95_cap';

  // Invariant: sumExcess > EPS ⇒ nonZero.length > 0
  let cap = percentileInterpolated(nonZero, usedPercentile);
  if (!Number.isFinite(cap)) cap = Math.max(...nonZero);

  const cappedItems = applyCap(items, excess, cap, baseWeight);

  return {
    cappedItems,
    meta: {
      capped: true,
      reason,
      capValue: cap,
      usedPercentile,
      topShare,
      N,
    },
  };
}
