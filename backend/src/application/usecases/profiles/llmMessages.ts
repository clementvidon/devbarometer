import type { RelevantItem } from '../../../domain/entities';
import type { LlmMessage } from '../../ports/output/LlmPort';

export function makeProfileMessages(
  weightedItem: RelevantItem,
  systemPrompt: string,
): readonly LlmMessage[] {
  return [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content: `Texte : """${weightedItem.title}\n\n${weightedItem.content}"""`,
    },
  ];
}
