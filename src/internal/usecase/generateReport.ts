import { z } from 'zod';
import type { LlmPort } from '../core/port/LlmPort';
import { stripCodeFences } from '../../utils/stripCodeFences';

const WeatherEmoji = z.enum([
  '☀️',
  '🌤️',
  '⛅',
  '🌥️',
  '☁️',
  '🌦️',
  '🌧️',
  '⛈️',
  '❄️',
  '🌩️',
]);

export const ReportSchema = z.object({
  text: z.string().max(200),
  emoji: WeatherEmoji,
  timestamp: z.string().nonempty(),
});
export type Report = z.infer<typeof ReportSchema>;

const FALLBACK: Report = {
  text: 'Rapport indisponible.',
  emoji: '?',
  timestamp: new Date().toISOString(),
};

function makeMessages(emotionsText: string) {
  return [
    {
      role: 'system' as const,
      content: `
      Vous êtes un météorologue spécialisé dans l'analyse émotionnelle.
        Répondez STRICTEMENT un JSON brut avec ces clés :
        - "text" : une phrase ≤20 mots, style bulletin météo, décrivant le sentiment global de l'objet "emotions".
        - "emoji" : un seul emoji parmi ${WeatherEmoji.options.join(' ')}.
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
  ];
}

export async function generateReport(
  emotions: Record<string, number>,
  llm: LlmPort,
): Promise<Report> {
  const emotionsJson = JSON.stringify(emotions);

  try {
    const raw = await llm.run('gpt-4o-mini', makeMessages(emotionsJson));
    const cleaned = stripCodeFences(raw);
    const parsed = JSON.parse(cleaned);
    return ReportSchema.parse({
      ...parsed,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return FALLBACK;
  }
}
