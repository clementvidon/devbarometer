import { runLLM } from '../llm/llm';
import { z } from 'zod';

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
const ReportSchema = z.object({
  text: z.string().max(200),
  emoji: WeatherEmoji,
});

export type Report = z.infer<typeof ReportSchema>;

const EMPTY_REPORT: Report = {
  text: 'Aucun rapport disponible.',
  emoji: '☁️',
};

function stripCodeFences(raw: string): string {
  return raw
    .split('\n')
    .filter((line) => !line.trim().startsWith('```'))
    .join('\n')
    .trim();
}

const makeReportMessages = (emotionsText: string) => [
  {
    role: 'system' as const,
    content: `
Vous êtes un météorologue spécialisé dans l'analyse émotionnelle.
Répondez STRICTEMENT un JSON brut avec ces clés :
- "text" : une phrase ≤20 mots, style bulletin météo, décrivant le sentiment global de l'objet "emotions".
- "emoji" : un seul emoji parmi ☀️, 🌤️, ⛅, 🌥️, ☁️, 🌦️, 🌧️, ⛈️, ❄️, 🌩️.
Aucune autre clé ou mise en forme.
    `.trim(),
  },
  {
    role: 'user' as const,
    content: `
Voici l'objet "emotions" :
${emotionsText}

Générez le JSON demandé.
    `.trim(),
  },
];

export const interpretSentiment = async (
  emotionsText: string,
): Promise<Report> => {
  try {
    const raw = await runLLM('gpt-4o-mini', makeReportMessages(emotionsText));
    const cleaned = stripCodeFences(raw);

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('interpretSentiment: JSON invalide', cleaned);
      return EMPTY_REPORT;
    }

    const result = ReportSchema.safeParse(parsed);
    if (!result.success) {
      console.error(
        'interpretSentiment: validation échouée',
        result.error.format(),
      );
      return EMPTY_REPORT;
    }

    return result.data;
  } catch (err) {
    console.error('interpretSentiment: erreur LLM', err);
    return EMPTY_REPORT;
  }
};
