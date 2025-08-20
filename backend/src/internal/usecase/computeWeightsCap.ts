import type { RelevantItem } from '../core/entity/Item.ts';

export type WeightsCapOptions = {
  minN?: number;
  percentile?: number;
  percentileSmallN?: number;
  baseWeight?: number;
};

export type WeightsCapReason =
  | 'no_excess'
  | 'p90_cap_smallN'
  | 'p95_cap'
  | null;

export type WeightsCapResult = {
  cappedItems: RelevantItem[];
  capped: boolean;
  reason: WeightsCapReason;
  capValue?: number;
  usedPercentile?: number;
  topShare: number;
  N: number;
};

function sortAsc<T extends number>(arr: T[]): T[] {
  return [...arr].sort((a, b) => a - b);
}

function percentileInterpolated(values: number[], p: number): number {
  if (!values.length) return NaN;
  const s = sortAsc(values);
  if (s.length === 1) return s[0];
  const h = (s.length - 1) * p;
  const i = Math.floor(h);
  const frac = h - i;
  const lo = s[i];
  const hi = s[Math.min(i + 1, s.length - 1)];
  return lo + frac * (hi - lo);
}

function computeExcess(items: RelevantItem[], base: number) {
  const weights = items.map((i) => i.weight ?? 0);
  const excess = weights.map((w) => Math.max(0, w - base));
  const sumExcess = excess.reduce((a, b) => a + b, 0);
  return { weights, excess, sumExcess };
}

function computeTopShare(excess: number[], sumExcess: number) {
  if (sumExcess <= 0) return 0;
  const maxExcess = Math.max(...excess);
  return maxExcess / sumExcess;
}

function choosePercentile(N: number, minN: number, p: number, pSmall: number) {
  const isSmallN = N < minN;
  return {
    usedPercentile: isSmallN ? pSmall : p,
    reason: isSmallN
      ? ('p90_cap_smallN' as WeightsCapReason)
      : ('p95_cap' as WeightsCapReason),
  };
}

function computeCapValue(excess: number[], usedPercentile: number) {
  const nonZero = excess.filter((x) => x > 0);
  if (nonZero.length === 0) return { cap: NaN, nonZero };

  let cap = percentileInterpolated(nonZero, usedPercentile);
  if (!Number.isFinite(cap)) {
    cap = nonZero[nonZero.length - 1];
  }
  return { cap, nonZero };
}

function applyCap(
  items: RelevantItem[],
  excess: number[],
  cap: number,
  base: number,
): RelevantItem[] {
  return items.map((it, k) => ({
    ...it,
    weight: base + Math.min(excess[k], cap),
  }));
}

export function computeWeightsCap(
  items: RelevantItem[],
  opts: WeightsCapOptions = {},
): WeightsCapResult {
  const {
    minN = 10,
    percentile: p = 0.95,
    percentileSmallN = 0.9,
    baseWeight = 1,
  } = opts;

  const N = items.length;

  const { excess, sumExcess } = computeExcess(items, baseWeight);

  if (sumExcess === 0) {
    return {
      cappedItems: [...items],
      capped: false,
      reason: 'no_excess',
      topShare: 0,
      N,
    };
  }

  const topShare = computeTopShare(excess, sumExcess);

  const { usedPercentile, reason } = choosePercentile(
    N,
    minN,
    p,
    percentileSmallN,
  );

  const { cap } = computeCapValue(excess, usedPercentile);

  if (!Number.isFinite(cap)) {
    return {
      cappedItems: [...items],
      capped: false,
      reason: 'no_excess',
      topShare,
      N,
    };
  }

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
