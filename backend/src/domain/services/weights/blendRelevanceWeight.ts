import type { ItemRelevance, WeightedItem } from '../../../domain/entities';

export interface RelevanceBlendOptions {
  enabled: boolean;
  topicFloor: number;
}

export const DEFAULT_RELEVANCE_BLEND_OPTIONS = {
  enabled: true,
  topicFloor: 0.1,
} as const satisfies RelevanceBlendOptions;

export function blendRelevanceWeight(
  weightedItems: WeightedItem[],
  itemsRelevance: ItemRelevance[],
  opts: RelevanceBlendOptions = DEFAULT_RELEVANCE_BLEND_OPTIONS,
): WeightedItem[] {
  if (!opts.enabled) return weightedItems.slice();

  const topicScoreByRef = new Map(
    itemsRelevance.map((item) => [item.itemRef, item.topicScore]),
  );

  return weightedItems.map((item) => {
    const topicScore = Math.max(
      opts.topicFloor,
      topicScoreByRef.get(item.itemRef) ?? 1,
    );

    return {
      ...item,
      weight: item.weight * topicScore,
    };
  });
}
