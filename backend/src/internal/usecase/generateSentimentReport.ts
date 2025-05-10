import { z } from 'zod';
import type { LlmPort } from '../core/port/LlmPort';
import type { AgentMessage } from '../core/types/AgentMessage';
import { stripCodeFences } from '../../utils/stripCodeFences';
import { WEATHER_EMOJIS } from '../core/entity/SentimentReport';
import type { SentimentReport } from '../core/entity/SentimentReport';
import type { AverageSentiment } from '../core/entity/Sentiment';

const LLMOutputSchema = z.object({
  text: z.string().max(200),
  emoji: z.enum(WEATHER_EMOJIS),
});

const FALLBACK = {
  text: '',
  emoji: '☁️',
} satisfies SentimentReport;

function makeMessages(emotionsText: string): readonly AgentMessage[] {
  return [
    {
      role: 'system' as const,
      content: `
      Vous êtes un météorologue spécialisé dans l'analyse émotionnelle.
        Répondez STRICTEMENT un JSON brut avec ces clés :
        - "text" : une phrase ≤20 mots, style bulletin météo, décrivant le sentiment global de l'objet "emotions".
        - "emoji" : un seul emoji parmi ${WEATHER_EMOJIS.join(' ')}.
        Aucune autre clé ou mise en forme.
        `.trim(),
    },
    {
      role: 'user' as const,
      content: `
      Voici l'objet "emotions" en JSON:
        ${emotionsText}

      Générez le JSON demandé.
        `.trim(),
    },
  ] as const satisfies readonly AgentMessage[];
}

export async function generateSentimentReport(
  averageSentiment: AverageSentiment,
  llm: LlmPort,
): Promise<SentimentReport> {
  try {
    const raw = await llm.run(
      'gpt-4o-mini',
      0.1,
      makeMessages(JSON.stringify(averageSentiment.emotions)),
    );
    const json: unknown = JSON.parse(stripCodeFences(raw));
    const parsed = LLMOutputSchema.safeParse(json);
    return parsed.success ? parsed.data : FALLBACK;
  } catch {
    return FALLBACK;
  }
}
