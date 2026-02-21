import { type WeightedItem } from '../../../domain/entities';
import type { LlmMessage } from '../../ports/output/LlmPort';
import { type EmotionProfileSummary } from './summarizeProfile';

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

export function makeReportMessages(
  summary: EmotionProfileSummary,
  reportPrompt: string,
): readonly LlmMessage[] {
  return [
    {
      role: 'system',
      content: reportPrompt,
    },
    {
      role: 'user',
      content: `Voici le profil émotionnel JSON :\n${JSON.stringify(summary)}`,
    },
  ];
}
