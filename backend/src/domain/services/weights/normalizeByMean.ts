import type { WeightedItem } from '../../entities';

export interface NormalizeByMeanParams {
  /** Target mean (or sum, if you later add a sum-strategy). */
  target: number;
}

export function normalizeByMean(
  items: WeightedItem[],
  opts: NormalizeByMeanParams,
): WeightedItem[] {
  const { target } = opts;

  if (items.length === 0) return [];
  const sum = items.reduce((s, i) => s + i.weight, 0);
  const mean = sum / items.length;
  if (mean === 0) return items.map((i) => ({ ...i, weight: 0 }));
  const factor = target / mean;
  return items.map((i) => ({ ...i, weight: i.weight * factor }));
}
