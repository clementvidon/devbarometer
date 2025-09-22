import type OpenAI from 'openai';
import type {
  LlmMessage,
  LlmPort,
  LlmRunOptions,
} from '../../../core/port/LlmPort';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfter(headers?: Record<string, string>): number | null {
  const raw = headers?.['retry-after'];
  if (!raw) return null;
  const secs = Number(raw);
  if (!isNaN(secs)) return secs * 1000;
  const date = Date.parse(raw);
  return isNaN(date) ? null : Math.max(0, date - Date.now());
}

function isTransient(err: unknown): boolean {
  const e = err as { status?: number; code?: string };
  return (
    e?.status === 429 ||
    (typeof e?.status === 'number' && e.status >= 500) ||
    e?.code === 'rate_limit_exceeded'
  );
}

export class OpenAIAdapter implements LlmPort {
  constructor(private readonly client: OpenAI) {}

  async run(
    model: string,
    messages: readonly LlmMessage[],
    options?: LlmRunOptions,
  ): Promise<string> {
    const maxRetries = 3;
    const fallbackDelay = 1200;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const res = await this.client.chat.completions.create({
          model,
          messages: [...messages],
          temperature: options?.temperature,
          max_completion_tokens: options?.maxOutputTokens,
          top_p: options?.topP,
          presence_penalty: options?.presencePenalty,
          frequency_penalty: options?.frequencyPenalty,
          stop: options?.stop,
          seed: options?.seed,
          response_format: options?.responseFormat,
          logit_bias: options?.logitBias,
        });

        const content = res.choices?.[0]?.message?.content ?? '';
        if (!content.trim()) {
          console.error('[OpenAIAdapter] No content returned from OpenAI API');
          throw new Error('Empty content from OpenAI');
        }
        return content;
      } catch (err: unknown) {
        if (!isTransient(err) || attempt === maxRetries) {
          console.error(
            '[OpenAIAdapter] OpenAI API error (fatal, no retry):',
            err,
          );
          throw err instanceof Error ? err : new Error('Unknown error');
        }

        const fromHeader = parseRetryAfter(
          (err as { headers?: Record<string, string> }).headers,
        );
        const delay =
          (fromHeader ?? fallbackDelay) * attempt +
          Math.floor(Math.random() * 250);

        console.warn(
          `[OpenAIAdapter] Transient error (${
            (err as { status?: number; code?: string }).status ??
            (err as { code?: string }).code ??
            'unknown'
          }). Retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`,
        );

        await sleep(delay);
      }
    }
    throw new Error('Max retries exceeded');
  }
}
