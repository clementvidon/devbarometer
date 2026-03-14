import type { Item } from '../../../domain/entities';

export function makeRelevanceSignature(
  item: Pick<Item, 'title' | 'content'>,
): string {
  return `${item.title.trim()}\n\n${item.content.trim()}`;
}
