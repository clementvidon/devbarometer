import type { Item, RelevantItem } from '../entity/Item';

/**
 * Filters items to keep only those considered relevant.
 *
 * Contract:
 * - Input: `items` may be empty. Must not be mutated.
 * - Output: returns a subset of `items` (0..n). Order is preserved.
 * - If relevance cannot be determined for an item, it is treated as not relevant.
 */
export interface RelevanceFilterPort {
  filterItems(items: Item[]): Promise<RelevantItem[]>;
}
