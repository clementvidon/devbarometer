import type { WeightsPort } from '../../../application/ports/output/WeightsPort';
import type { RelevantItem, WeightedItem } from '../../entities';
import { capByPercentile } from './capByPercentile';
import { computeMomentum } from './computeMomentum';
import { normalizeByMean } from './normalizeByMean';
import { sanitizeScores } from './sanitizeScores';

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

export interface MomentumWeightsOptions {
  momentum: MomentumOptions;
  cap: CapOptions;
  normalize: NormalizeOptions;
}

export const DEFAULT_MOMENTUM_OPTIONS = {
  baseWeight: 1,
} as const satisfies MomentumOptions;

export const DEFAULT_CAP_OPTIONS = {
  minN: 10,
  percentile: 0.95,
  percentileSmallN: 0.9,
  baseWeight: 1,
  concentrationGate: 0.35,
} as const satisfies CapOptions;

export const DEFAULT_NORMALIZE_OPTIONS = {
  enabled: true,
  target: 1,
} as const satisfies NormalizeOptions;

export const DEFAULT_WEIGHTS_OPTIONS = {
  momentum: { ...DEFAULT_MOMENTUM_OPTIONS },
  cap: { ...DEFAULT_CAP_OPTIONS },
  normalize: { ...DEFAULT_NORMALIZE_OPTIONS },
} as const satisfies MomentumWeightsOptions;

function mergeMomentumWeightsOptions(
  opts: Partial<MomentumWeightsOptions> = {},
): MomentumWeightsOptions {
  return {
    momentum: { ...DEFAULT_MOMENTUM_OPTIONS, ...(opts.momentum ?? {}) },
    cap: { ...DEFAULT_CAP_OPTIONS, ...(opts.cap ?? {}) },
    normalize: { ...DEFAULT_NORMALIZE_OPTIONS, ...(opts.normalize ?? {}) },
  };
}

export class MomentumWeightsStrategy implements WeightsPort {
  private readonly opts: MomentumWeightsOptions;

  constructor(opts: Partial<MomentumWeightsOptions> = {}) {
    this.opts = mergeMomentumWeightsOptions(opts);
  }

  async computeWeights(
    items: RelevantItem[],
    prevItems: RelevantItem[],
  ): Promise<WeightedItem[]> {
    const { momentum, cap, normalize } = this.opts;

    const { safeItems, safePrevItems } = sanitizeScores(items, prevItems);
    const momentumItems = computeMomentum(safeItems, safePrevItems, momentum);
    const capResult = capByPercentile(momentumItems, cap);
    const cappedItems = capResult.cappedItems;

    const weightedItems = normalize.enabled
      ? normalizeByMean(cappedItems, normalize)
      : cappedItems.slice();
    return Promise.resolve(weightedItems);
  }
}
