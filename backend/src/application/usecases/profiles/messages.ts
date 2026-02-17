import type { WeightedItem } from '../../../domain/entities';
import type { LlmMessage } from '../../ports/output/LlmPort';

export function makeEmotionMessages(
  item: WeightedItem,
  systemPrompt: string,
): readonly LlmMessage[] {
  return [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content: `Texte : """${item.title}\n\n${item.content}"""`.trim(),
    },
  ] as const;
}

export function makeTonalityMessages(
  item: WeightedItem,
  systemPrompt: string,
): readonly LlmMessage[] {
  return [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content: `Texte : """${item.title}\n\n${item.content}"""`.trim(),
    },
  ] as const;
}
