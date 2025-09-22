import type { Item } from '../../core/entity/Item.ts';

export function filterByScore(items: Item[], minScore = 0): Item[] {
  return items.filter((i) => i.score >= minScore);
}
