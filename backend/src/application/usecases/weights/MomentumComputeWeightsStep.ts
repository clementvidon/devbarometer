import type { RelevantItem, WeightedItem } from '../../../domain/entities';
import {
  capByPercentile,
  type CapOptions,
} from '../../../domain/services/weights/capByPercentile';
import {
  computeMomentum,
  type MomentumOptions,
} from '../../../domain/services/weights/computeMomentum';
import {
  normalizeByMean,
  type NormalizeOptions,
} from '../../../domain/services/weights/normalizeByMean';
import { sanitizeScores } from '../../../domain/services/weights/sanitizeScores';
import type { ComputeWeightsPort } from '../../ports/pipeline/ComputeWeightsPort';

interface MomentumWeightsOptions {
  momentum: MomentumOptions;
  cap: CapOptions;
  normalize: NormalizeOptions;
}

export const DEFAULT_MOMENTUM_OPTIONS = {
  baseWeight: 1,
} satisfies MomentumOptions;

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

export const DEFAULT_MOMENTUM_COMPUTE_WEIGHTS_OPTIONS = {
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

export class MomentumComputeWeightsStep implements ComputeWeightsPort {
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
