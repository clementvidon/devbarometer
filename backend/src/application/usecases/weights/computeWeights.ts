import type { RelevantItem, WeightedItem } from '../../../domain/entities';
import { capByPercentile } from '../../../domain/services/weights/capByPercentile';
import { computeMomentum } from '../../../domain/services/weights/computeMomentum';
import { normalizeByMean } from '../../../domain/services/weights/normalizeByMean';
import { sanitizeMomentumInputs } from '../../../domain/services/weights/sanitizeMomentumInputs';
import type {
  CapStepOptions,
  MomentumStepOptions,
  MomentumWeightsOptions,
  NormalizeStepOptions,
} from '../../ports/pipeline/ComputeWeightsPort';

export const DEFAULT_MOMENTUM_OPTIONS = {
  enabled: true,
  baseWeight: 1,
} satisfies MomentumStepOptions;

export const DEFAULT_CAP_OPTIONS = {
  enabled: true,
  minN: 10,
  percentile: 0.95,
  percentileSmallN: 0.9,
  baseWeight: 1,
  concentrationGate: 0.35,
} as const satisfies CapStepOptions;

export const DEFAULT_NORMALIZE_OPTIONS = {
  enabled: true,
  target: 1,
} as const satisfies NormalizeStepOptions;

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

export function computeWeights(
  items: RelevantItem[],
  prevItems: RelevantItem[],
  opts: Partial<MomentumWeightsOptions> = {},
): Promise<WeightedItem[]> {
  const { momentum, cap, normalize } = mergeMomentumWeightsOptions(opts);

  const { safeItems, safePrevItems } = sanitizeMomentumInputs(items, prevItems);

  const baseWeightedItems = momentum.enabled
    ? computeMomentum(safeItems, safePrevItems, momentum)
    : safeItems.map((it) => ({ ...it, weight: momentum.baseWeight }));

  const cappedItems = cap.enabled
    ? capByPercentile(baseWeightedItems, cap).cappedItems
    : baseWeightedItems.slice();

  const weightedItems = normalize.enabled
    ? normalizeByMean(cappedItems, { target: normalize.target })
    : cappedItems.slice();

  return Promise.resolve(weightedItems);
}
