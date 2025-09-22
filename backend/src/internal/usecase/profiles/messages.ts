import type { WeightedItem } from '../../core/entity/Item.ts';
import type { LlmMessage } from '../../core/port/LlmPort.ts';

export function makeEmotionMessages(
  item: WeightedItem,
  prompt: string,
): readonly LlmMessage[] {
  return [
    {
      role: 'system',
      content: prompt,
    },
    {
      role: 'user',
      content: `Texte : """${item.title}\n\n${item.content}"""`.trim(),
    },
  ] as const;
}

export function makeTonalityMessages(
  item: WeightedItem,
  prompt: string,
): readonly LlmMessage[] {
  return [
    {
      role: 'system',
      content: prompt,
    },
    {
      role: 'user',
      content: `Texte : """${item.title}\n\n${item.content}"""`.trim(),
    },
  ] as const;
}
