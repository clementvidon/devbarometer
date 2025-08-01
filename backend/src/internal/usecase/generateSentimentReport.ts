import { z } from 'zod';
import { stripCodeFences } from '../../utils/stripCodeFences.ts';
import type { AverageSentiment } from '../core/entity/Sentiment.ts';
import type { SentimentReport } from '../core/entity/SentimentReport.ts';
import { WEATHER_EMOJIS } from '../core/entity/SentimentReport.ts';
import type { LlmPort } from '../core/port/LlmPort.ts';
import type { AgentMessage } from '../core/types/AgentMessage.ts';

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
      You translate emotion data into short weather-style summaries. Output a valid JSON with:

      1. "text": one sentence, ≤20 words, like a weather bulletin. Use meteorological terms (e.g., unstable front, overcast, pressure rising). Avoid poetic or abstract language.

      Use this structure:
      "The emotional climate is [the overall state], with [the dominant forces] and [the modulating factors]."

      The sentence must be fluent, clear, and natural. Avoid repetitive or clunky phrasing (e.g., "and and and").

      Interpret emotions in context:
      - High anticipation → anxious if fear/sadness/negative are high, hopeful if joy/trust/positive dominate
      - High surprise → positive or negative depending on surrounding emotions
      - High trust with strong negativity → interpret as fragile or tense
      - High disgust → use subtle metaphors (e.g., stale air, contaminated pressure)

      - Prioritize prominent emotions. Reflect their weight — don’t treat all emotions equally.
      - Avoid vague phrases like “significant negativity” — describe the actual emotional signals using concrete or abstract terms.
      - Emphasize the most intense emotional signals.
      - If a set of emotions clearly forms a pattern, you may group them into a higher-order abstraction (e.g., fear + sadness = emotional heaviness; fear + anger + disgust = unrest).
      - After generating the sentence, review it once for style and flow. Revise if needed to improve naturalness, fluency, and variation. Avoid repetitive, mechanical, or flat phrasing.

      2. "emoji": one emoji from: ${WEATHER_EMOJIS.join(' ')}

      Return a raw JSON with only these two keys. No other content or formatting.
        `.trim(),
    },
    {
      role: 'user' as const,
      content: `
      Here is the "emotions" object in JSON:
        ${emotionsText}

      Generate the requested JSON.
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
