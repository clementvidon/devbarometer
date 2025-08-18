import type { RelevantItem } from '../core/entity/Item.ts';

export type WeightsCapOptions = {
  minN?: number;
  topShareThreshold?: number;
  percentile?: number;
};

export type WeightsCapResult = {
  cappedItems: RelevantItem[];
  capped: boolean;
  reason: 'minN' | 'concentration' | null;
  capValue?: number;
  topShare: number;
  N: number;
};

function percentile(values: number[], p = 0.95): number {
  if (!values.length) return Infinity;
  const s = [...values].sort((a, b) => a - b);
  const idx = Math.floor(p * (s.length - 1));
  return s[idx];
}

function computeTopShare(weights: number[]): number {
  const sum = weights.reduce((a, b) => a + b, 0);
  const max = Math.max(0, ...weights);
  return sum > 0 ? max / sum : 0;
}

export function computeWeightsCap(
  items: RelevantItem[],
  opts: WeightsCapOptions = {},
): WeightsCapResult {
  const { minN = 20, topShareThreshold = 0.4, percentile: p = 0.95 } = opts;

  const N = items.length;
  const weights = items.map((i) => i.weight ?? 0);
  const topShare = computeTopShare(weights);

  const byMinN = N >= minN;
  const byConcentration = topShare > topShareThreshold;

  if (!byMinN && !byConcentration) {
    return {
      cappedItems: items.map((i) => ({ ...i })),
      capped: false,
      reason: null,
      topShare,
      N,
    };
  }

  const cap = percentile(weights, p);
  const cappedItems = items.map((i) => ({
    ...i,
    weight: Math.min(i.weight ?? 0, cap),
  }));

  return {
    cappedItems: cappedItems,
    capped: true,
    reason: byMinN ? 'minN' : 'concentration',
    capValue: cap,
    topShare,
    N,
  };
}
