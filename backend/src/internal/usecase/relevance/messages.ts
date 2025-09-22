// internal/usecase/relevance/messages.ts
import type { Item } from '../../core/entity/Item.ts';
import type { LlmMessage } from '../../core/port/LlmPort.ts';

export function makeRelevanceMessages(
  item: Item,
  prompt: string,
): readonly LlmMessage[] {
  return [
    {
      role: 'system' as const,
      content: prompt.trim(),
    },
    {
      role: 'user' as const,
      content: `
Data to be filtered following the given instructions:
Item title: ${item.title}
Item content: ${item.content}
      `.trim(),
    },
  ] as const satisfies readonly LlmMessage[];
}
