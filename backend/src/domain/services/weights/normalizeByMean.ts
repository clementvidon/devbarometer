import type { WeightedItem } from '../../entities';
import type { NormalizeOptions } from './MomentumWeightsStrategy';

/**
 * Normalize weights so that their mean equals `target`. Input is not mutated.
 */
export function normalizeByMean(
  items: WeightedItem[],
  opts: NormalizeOptions,
): WeightedItem[] {
  const { target } = opts;

  if (items.length === 0) return [];
  const sum = items.reduce((s, i) => s + i.weight, 0);
  const mean = sum / items.length;
  if (mean === 0) return items.map((i) => ({ ...i, weight: 0 }));
  const factor = target / mean;
  return items.map((i) => ({ ...i, weight: i.weight * factor }));
}
