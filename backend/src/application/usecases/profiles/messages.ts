import type { WeightedItem } from '../../../domain/entities';
import type { LlmMessage } from '../../../internal/core/port/LlmPort';

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
