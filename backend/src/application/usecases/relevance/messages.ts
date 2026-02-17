import type { Item } from '../../../domain/entities';
import type { LlmMessage } from '../../ports/output/LlmPort';

export function makeRelevanceMessages(
  item: Item,
  systemPrompt: string,
): readonly LlmMessage[] {
  return [
    {
      role: 'system' as const,
      content: systemPrompt,
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
