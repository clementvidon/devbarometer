import type { ItemRelevance } from '../../../domain/entities';
import type { RelevanceGateOptions } from '../../ports/pipeline/FilterRelevantItemsPort';

export function applyRelevanceGates(
  itemRelevance: ItemRelevance,
  gates: RelevanceGateOptions,
): ItemRelevance {
  if (!gates.enabled) return itemRelevance;
  if (!itemRelevance.relevant) return itemRelevance;
  if (itemRelevance.category !== 'emotional_insight') {
    return { ...itemRelevance, relevant: false };
  }
  if (itemRelevance.topicScore < gates.topicMin) {
    return { ...itemRelevance, relevant: false };
  }
  if (itemRelevance.genreScore < gates.genreMin) {
    return { ...itemRelevance, relevant: false };
  }
  return itemRelevance;
}
