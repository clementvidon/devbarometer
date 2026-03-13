import type {
  Item,
  ItemRelevance,
  RelevantItem,
} from '../../../domain/entities';

export function selectRelevantItems(
  items: Item[],
  itemsRelevance: ItemRelevance[],
): RelevantItem[] {
  const relevantRefs = new Set(
    itemsRelevance.filter((item) => item.relevant).map((item) => item.itemRef),
  );

  return items.filter((item) => relevantRefs.has(item.itemRef));
}
