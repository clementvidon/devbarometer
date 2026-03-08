import type { RelevantItem, WeightedItem } from '../../../domain/entities';
import type { CapParams } from '../../../domain/services/weights/capByPercentile';
import type { MomentumParams } from '../../../domain/services/weights/computeMomentum';
import type { NormalizeByMeanParams } from '../../../domain/services/weights/normalizeByMean';

export type NormalizeStepOptions = { enabled: boolean } & NormalizeByMeanParams;

export interface MomentumWeightsOptions {
  /** Momentum computation parameters (baseline weight, etc.) */
  momentum: MomentumParams;
  /** Score capping parameters to limit outliers (percentiles, thresholds, etc.) */
  cap: CapParams;
  /** Normalization parameters to rescale weights (target mean, enable/disable, etc.) */
  normalize: NormalizeStepOptions;
}

/**
 * Compute weights for the given items.
 *
 * Contract (interface-wide):
 * - Inputs are read-only; `items` may be empty; order preserved in output.
 * - Deterministic for identical inputs; may use `source`-based matching.
 */
export interface ComputeWeightsPort {
  /** Returns new WeightedItems for `items` using `prevItems` as context. */
  computeWeights(
    items: RelevantItem[],
    prevItems: RelevantItem[],
    opts?: Partial<MomentumWeightsOptions>,
  ): Promise<WeightedItem[]>;
}
