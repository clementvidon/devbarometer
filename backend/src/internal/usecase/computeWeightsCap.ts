import type { WeightedItem } from '../core/entity/Item.ts';

export type WeightsCapOptions = {
  minN?: number;
  percentile?: number;
  percentileSmallN?: number;
  baseWeight?: number;
  concentrationGate?: number;
};

export type WeightsCapReason =
  | 'no_excess'
  | 'low_concentration'
  | 'p90_cap_smallN'
  | 'p95_cap';

export type WeightsCapResult = {
  cappedItems: WeightedItem[];
  capped: boolean;
  reason: WeightsCapReason;
  capValue?: number;
  usedPercentile?: number;
  topShare: number;
  N: number;
};

const sortAsc = (arr: number[]) => [...arr].sort((a, b) => a - b);

function percentileInterpolated(values: number[], p: number): number {
  if (!values.length) return NaN;
  const s = sortAsc(values);
  if (s.length === 1) return s[0];
  const h = (s.length - 1) * p;
  const i = Math.floor(h);
  const frac = h - i;
  return s[i] + frac * (s[i + 1] - s[i]);
}

function computeExcess(items: WeightedItem[], base: number) {
  const weights = items.map((i) => i.weight ?? 0);
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

export function computeWeightsCap(
  items: WeightedItem[],
  opts: WeightsCapOptions = {},
): WeightsCapResult {
  const {
    minN = 10,
    percentile = 0.95,
    percentileSmallN = 0.9,
    baseWeight = 1,
    concentrationGate = 0.35,
  } = opts;

  const N = items.length;
  const { excess, sumExcess } = computeExcess(items, baseWeight);
  const topShare = computeTopShare(excess, sumExcess);

  if (sumExcess === 0) {
    return {
      cappedItems: [...items],
      capped: false,
      reason: 'no_excess',
      topShare,
      N,
    };
  }

  if (topShare < concentrationGate) {
    return {
      cappedItems: [...items],
      capped: false,
      reason: 'low_concentration',
      topShare,
      N,
    };
  }

  const isSmallN = N < minN;
  const usedPercentile = isSmallN ? percentileSmallN : percentile;
  const reason = isSmallN ? 'p90_cap_smallN' : 'p95_cap';

  const nonZero = excess.filter((x) => x > 0);
  let cap = percentileInterpolated(nonZero, usedPercentile);
  if (!Number.isFinite(cap)) cap = nonZero[nonZero.length - 1];

  const cappedItems = applyCap(items, excess, cap, baseWeight);

  return {
    cappedItems,
    capped: true,
    reason,
    capValue: cap,
    usedPercentile,
    topShare,
    N,
  };
}
