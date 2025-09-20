import type { RelevantItem, WeightedItem } from '../../../core/entity/Item.ts';
import type { WeightsPort } from '../../../core/port/WeightsPort.ts';

export interface MomentumOptions {
  /** Weight assigned when item is new or delta <= 0. */
  baseWeight: number;
}

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

export interface NormalizeOptions {
  /** Enable normalization. */
  enabled: boolean;
  /** Target mean (or sum, if you later add a sum-strategy). */
  target: number;
}

export interface WeightsOptions {
  momentum: MomentumOptions;
  cap: CapOptions;
  normalize: NormalizeOptions;
}

export const DEFAULT_MOMENTUM_OPTIONS: MomentumOptions = {
  baseWeight: 1,
};

export const DEFAULT_CAP_OPTIONS: CapOptions = {
  minN: 10,
  percentile: 0.95,
  percentileSmallN: 0.9,
  baseWeight: 1,
  concentrationGate: 0.35,
};

export const DEFAULT_NORMALIZE_OPTIONS: NormalizeOptions = {
  enabled: true,
  target: 1,
};

export const DEFAULT_WEIGHTS_OPTIONS: WeightsOptions = {
  momentum: { ...DEFAULT_MOMENTUM_OPTIONS },
  cap: { ...DEFAULT_CAP_OPTIONS },
  normalize: { ...DEFAULT_NORMALIZE_OPTIONS },
};

function mergeWeightsOptions(
  opts: Partial<WeightsOptions> = {},
): WeightsOptions {
  return {
    momentum: { ...DEFAULT_MOMENTUM_OPTIONS, ...(opts.momentum ?? {}) },
    cap: { ...DEFAULT_CAP_OPTIONS, ...(opts.cap ?? {}) },
    normalize: { ...DEFAULT_NORMALIZE_OPTIONS, ...(opts.normalize ?? {}) },
  };
}

/**
 * Normalize weights so that their mean equals `target`. Input is not mutated.
 */
export function normalizeByMean(
  items: WeightedItem[],
  opts: NormalizeOptions,
): WeightedItem[] {
  const { target } = opts;

  if (items.length === 0) return [];
  const sum = items.reduce((s, i) => s + (i.weight ?? 0), 0);
  const mean = sum / items.length;
  if (mean === 0) return items.map((i) => ({ ...i, weight: 0 }));
  const factor = target / mean;
  return items.map((i) => ({ ...i, weight: (i.weight ?? 0) * factor }));
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
export function computeWeightsCap(
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

function isNew(prevRaw: number | undefined): boolean {
  return prevRaw === undefined;
}

function noPositiveDelta(todayRaw: number, prevRaw: number): boolean {
  return todayRaw <= prevRaw;
}

/**
 * Compute momentum weights:
 * - new item or non-positive delta -> baseWeight
 * - positive delta -> baseWeight + log1p(delta)
 * Input arrays are not mutated.
 */
export function computeMomentumWeights(
  today: RelevantItem[],
  prev: RelevantItem[] = [],
  opts: MomentumOptions,
): WeightedItem[] {
  const prevMap = new Map<string, number>(
    prev.map((i) => [i.source, i.score ?? 0]),
  );
  const { baseWeight } = opts;

  return today.map((it) => {
    const todayRaw = it.score;
    const prevRaw = prevMap.get(it.source);

    if (isNew(prevRaw)) {
      return { ...it, weight: baseWeight };
    }

    if (noPositiveDelta(todayRaw, prevRaw as number)) {
      return { ...it, weight: baseWeight };
    }

    const delta = todayRaw - (prevRaw as number);
    const momentum = baseWeight + Math.log1p(delta);
    return { ...it, weight: momentum };
  });
}

/**
 * Sanitize `score` fields in current and previous RelevantItems.
 *
 * - Replaces non-finite values (`NaN`, `Infinity`, `-Infinity`) by `0`.
 * - Logs a warning with a sample of offending items (up to 5).
 * - Returns sanitized copies of both arrays.
 */
export function sanitizeScores(
  items: RelevantItem[],
  prevItems: RelevantItem[],
) {
  const sanitize = (arr: RelevantItem[], fieldName = 'score') => {
    const nonFinite = arr.filter((i) => !Number.isFinite(i.score));
    if (nonFinite.length > 0) {
      const sample = nonFinite
        .slice(0, 5)
        .map((i) => `${i.source}=${String(i.score)}`)
        .join(', ');
      console.warn(
        `[MomentumWeightsAdapter] ${nonFinite.length} non-finite ${fieldName}(s) found — sanitized to 0. Samples: ${sample}`,
      );
    }
    return arr.map((i) => (Number.isFinite(i.score) ? i : { ...i, score: 0 }));
  };

  const safeItems = sanitize(items, 'score');
  const safePrevItems = sanitize(prevItems, 'prev.score');

  return { safeItems, safePrevItems };
}

export class MomentumWeightsAdapter implements WeightsPort {
  private readonly opts: WeightsOptions;

  constructor(opts: Partial<WeightsOptions> = {}) {
    this.opts = mergeWeightsOptions(opts);
  }

  async computeWeights(
    items: RelevantItem[],
    prevItems: RelevantItem[],
  ): Promise<WeightedItem[]> {
    const { momentum, cap, normalize } = this.opts;

    const { safeItems, safePrevItems } = sanitizeScores(items, prevItems);
    const momentumItems = computeMomentumWeights(
      safeItems,
      safePrevItems,
      momentum,
    );
    const cappedItems = computeWeightsCap(momentumItems, cap).cappedItems;
    const weightedItems = normalize.enabled
      ? normalizeByMean(cappedItems, normalize)
      : cappedItems.slice();
    return Promise.resolve(weightedItems);
  }
}
