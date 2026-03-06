import type { LlmMessage } from '../../ports/output/LlmPort';
import { type EmotionProfileSummary } from '../report/summarizeProfile';

export function makeReportMessages(
  summary: EmotionProfileSummary,
  systemPrompt: string,
): readonly LlmMessage[] {
  return [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content: `Voici le profil émotionnel JSON :\n${JSON.stringify(summary)}`,
    },
  ];
}
