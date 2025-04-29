import { z } from 'zod';
import type { LlmPort } from '../core/port/LlmPort';
import { stripCodeFences } from '../../utils/stripCodeFences';
import type {
  SentimentReport,
  WeatherEmoji,
} from '../core/entity/SentimentReport';
import type { AverageSentiment } from '../core/entity/Sentiment';

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
] as [WeatherEmoji, ...WeatherEmoji[]]);

const LLMOutputSchema = z.object({
  text: z.string().max(200),
  emoji: WeatherEmoji,
});
type LlmOutput = z.infer<typeof LLMOutputSchema>;

const FALLBACK: SentimentReport = {
  text: 'Report unavailable.',
  emoji: '☁️',
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

export async function generateSentimentReport(
  averageSentiment: AverageSentiment,
  llm: LlmPort,
): Promise<SentimentReport> {
  const emotionsJson = JSON.stringify(averageSentiment.emotions);

  try {
    const raw = await llm.run('gpt-4o-mini', makeMessages(emotionsJson));
    const cleaned = stripCodeFences(raw);
    const json: unknown = JSON.parse(cleaned);
    const llmResult = LLMOutputSchema.safeParse(json);
    if (!llmResult.success) {
      console.error(
        '[generateSentimentReport] LLM returned invalid JSON format.',
        llmResult.error,
      );
      return {
        ...FALLBACK,
      };
    }
    const report: SentimentReport = {
      text: llmResult.data.text,
      emoji: llmResult.data.emoji,
    };
    return report;
  } catch (err) {
    console.error(
      '[generateSentimentReport] LLM call failed. Returning fallback report.',
      err,
    );
    return { ...FALLBACK };
  }
}
