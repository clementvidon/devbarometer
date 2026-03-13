import type { RelevantItem, WeightedItem } from '../../../domain/entities';
import { capByPercentile } from '../../../domain/services/weights/capByPercentile';
import { computeMomentumWeight } from '../../../domain/services/weights/computeMomentumWeight';
import { sanitizeMomentumInputs } from '../../../domain/services/weights/sanitizeMomentumInputs';
import type {
  CapStepOptions,
  MomentumStepOptions,
  MomentumWeightsOptions,
} from '../../ports/pipeline/ComputeMomentumWeightsPort';

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

export const DEFAULT_COMPUTE_MOMENTUM_WEIGHTS_OPTIONS = {
  momentum: { ...DEFAULT_MOMENTUM_OPTIONS },
  cap: { ...DEFAULT_CAP_OPTIONS },
} as const satisfies MomentumWeightsOptions;

function mergeMomentumWeightsOptions(
  opts: Partial<MomentumWeightsOptions> = {},
): MomentumWeightsOptions {
  return {
    momentum: { ...DEFAULT_MOMENTUM_OPTIONS, ...(opts.momentum ?? {}) },
    cap: { ...DEFAULT_CAP_OPTIONS, ...(opts.cap ?? {}) },
  };
}

export function computeMomentumWeights(
  items: RelevantItem[],
  prevItems: RelevantItem[],
  opts: Partial<MomentumWeightsOptions> = {},
): Promise<WeightedItem[]> {
  const { momentum, cap } = mergeMomentumWeightsOptions(opts);

  const { safeItems, safePrevItems } = sanitizeMomentumInputs(items, prevItems);

  const baseWeightedItems = momentum.enabled
    ? computeMomentumWeight(safeItems, safePrevItems, momentum)
    : safeItems.map((it) => ({ ...it, weight: momentum.baseWeight }));

  const cappedItems = cap.enabled
    ? capByPercentile(baseWeightedItems, cap).cappedItems
    : baseWeightedItems.slice();

  return Promise.resolve(cappedItems);
}
