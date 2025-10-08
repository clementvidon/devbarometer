import type { Item } from '../../../../domain/entities';

export function filterByScore(items: Item[], minScore = 0): Item[] {
  return items.filter((i) => i.score >= minScore);
}
