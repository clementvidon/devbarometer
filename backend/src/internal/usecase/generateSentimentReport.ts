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

      You are an expert in emotional psychology and poetic writing.

      You translate emotion data into short weather-style summaries. Output a valid JSON with:

      1. "text": Given an object with emotions and polarity scores, write a **short (≤20 words)** sentence that **evokes the emotional atmosphere**.

      ### Instructions:

      * Focus on the **top 2–3 emotions** (highest scores among: anger, fear, anticipation, trust, surprise, sadness, joy, disgust).
      * Use 'positive' and 'negative' as **modifiers of tone**, not content:

        * If 'positive > 0.6', keep the tone bright, hopeful, or peaceful.
        * If 'negative > 0.6', lean into tension, doubt, sadness or unease.
        * If they’re both mid-range, allow for **emotional ambiguity** or **mixed feelings**.
      * Avoid listing emotions. Use metaphor, mood, or imagery to express the emotional mix.
      * Never exceed 20 words.

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
