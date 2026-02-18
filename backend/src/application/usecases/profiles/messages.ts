import type { WeightedItem } from '../../../domain/entities';
import type { LlmMessage } from '../../ports/output/LlmPort';

export function makeProfileMessages(
  weightedItem: WeightedItem,
  systemPrompt: string,
): readonly LlmMessage[] {
  return [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content:
        `Texte : """${weightedItem.title}\n\n${weightedItem.content}"""`.trim(),
    },
  ] as const;
}
