import type { RelevantItem, WeightedItem } from '../../domain/entities';

/**
 * Compute weights for the given items.
 *
 * Contract (interface-wide):
 * - Inputs are read-only; `items` may be empty; order preserved in output.
 * - Deterministic for identical inputs; may use `source`-based matching.
 */
export interface WeightsPort {
  /** Returns new WeightedItems for `items` using `prevItems` as context. */
  computeWeights(
    items: RelevantItem[],
    prevItems: RelevantItem[],
  ): Promise<WeightedItem[]>;
}
