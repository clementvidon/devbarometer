import type { WeightedItem } from '../../entities';

export interface CapOptions {
  /** Minimum N to use main percentile; below this we use percentileSmallN. */
  minN: number;
  /** Main percentile for excess capping, in [0,1]. */
  percentile: number;
  /** Percentile when N < minN. */
  percentileSmallN: number;
  /** Baseline weight used to compute "excess" = max(0, weight - baseWeight). */
  baseWeight: number;
  /** Concentration threshold in [0,1]; skip cap if topShare < this. */
  concentrationGate: number;
}

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

function percentileInterpolated(values: number[], percentile: number): number {
  if (!Array.isArray(values) || values.length === 0) return NaN;

  const sortedFinite = sortAsc(values.filter(Number.isFinite));
  if (sortedFinite.length === 0) return NaN;
  if (sortedFinite.length === 1) return sortedFinite[0];

  const clampedPercentile = Number.isFinite(percentile)
    ? Math.max(0, Math.min(1, percentile))
    : 0;

  const lastIndex = sortedFinite.length - 1;
  const position = lastIndex * clampedPercentile;
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.min(lowerIndex + 1, lastIndex);
  const fraction = position - lowerIndex;

  const lowerValue = sortedFinite[lowerIndex];
  const upperValue = sortedFinite[upperIndex];

  return lowerValue + fraction * (upperValue - lowerValue);
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

export function capByPercentile(
  items: WeightedItem[],
  opts: CapOptions,
): { cappedItems: WeightedItem[]; meta: WeightsCapMeta } {
  const { minN, percentile, percentileSmallN, baseWeight, concentrationGate } =
    opts;

  const N = items.length;
  const { excess, sumExcess } = computeExcess(items, baseWeight);

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
