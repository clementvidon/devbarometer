import type { RelevantItem, WeightedItem } from '../entity';

/**
 * Compute weights for the given items.
 *
 * Contract:
 * - Input: `items` may be empty. Must not be mutated.
 * - Input: `prevItems` may be an empty array (default `[]`). When present,
 *   entries should be matched by `source` to allow momentum-based calculations.
 * - Output: returns a new array of WeightedItems (0..n). Order of `items` is preserved.
 * - Implementations must not mutate input objects and should be deterministic for identical input.
 */
export interface WeightsPort {
  computeWeights(
    items: RelevantItem[],
    prevItems: RelevantItem[],
  ): Promise<WeightedItem[]>;
}
