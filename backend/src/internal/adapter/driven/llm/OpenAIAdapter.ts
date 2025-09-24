import type OpenAI from 'openai';
import type {
  ChatCompletion,
  ChatCompletionCreateParamsNonStreaming,
} from 'openai/resources';
import type {
  LlmMessage,
  LlmPort,
  LlmRunOptions,
} from '../../../core/port/LlmPort';
import { sleep } from '../../../lib/async/sleep.ts';
import { parseRetryAfter } from '../../../lib/http/parseRetryAfter.ts';

export interface OpenAIOptions {
  maxRetries: number;
  baseBackoffMs: number;
}

const DEFAULT_OPENAI_OPTIONS = {
  /** How many times to retry transient errors */
  maxRetries: 3,
  /** Base backoff duration (ms) before multiplying by attempt */
  baseBackoffMs: 1200,
} as const satisfies OpenAIOptions;

export function mergeOpenAIOptions(
  opts: Partial<OpenAIOptions> = {},
): OpenAIOptions {
  return { ...DEFAULT_OPENAI_OPTIONS, ...opts };
}

function getErrorStatus(err: unknown): string {
  const e = err as { status?: number; code?: string };
  if (e.status && e.status >= 100) return e.status.toString();
  if (e.code) return e.code;
  return 'unknown';
}

export function computeDelay(
  attempt: number,
  baseDelayMs: number,
  jitterRangeMs = 250,
): number {
  const jitter = Math.floor(Math.random() * jitterRangeMs);
  return baseDelayMs * attempt + jitter;
}

export function getOpenAIErrorHeaders(
  err: unknown,
): Record<string, string> | undefined {
  return (err as { headers?: Record<string, string> }).headers;
}

export function isRetryableOpenAIError(err: unknown): boolean {
  const e = err as { status?: number; code?: string };
  const isTooManyRequests = e?.status === 429;
  const isServerError = typeof e?.status === 'number' && e.status >= 500;
  const isRateLimitExceeded = e?.code === 'rate_limit_exceeded';
  return isTooManyRequests || isServerError || isRateLimitExceeded;
}

export function shouldRetry(
  err: unknown,
  attempt: number,
  maxRetries: number,
): boolean {
  return !isRetryableOpenAIError(err) || attempt === maxRetries ? false : true;
}

export function extractOpenAIMessageContent(
  res: ChatCompletion,
): string | null {
  return res.choices?.[0]?.message?.content?.trim() ?? null;
}

export function buildOpenAIRequestPayload(
  model: string,
  messages: readonly LlmMessage[],
  options?: LlmRunOptions,
): ChatCompletionCreateParamsNonStreaming {
  return {
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
  };
}

export class OpenAIAdapter implements LlmPort {
  private readonly opts: OpenAIOptions;

  constructor(
    private readonly client: OpenAI,
    opts: Partial<OpenAIOptions> = {},
  ) {
    this.opts = mergeOpenAIOptions(opts);
  }

  async run(
    model: string,
    messages: readonly LlmMessage[],
    options?: LlmRunOptions,
  ): Promise<string> {
    const { maxRetries, baseBackoffMs } = this.opts;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const payload = buildOpenAIRequestPayload(model, messages, options);
        const res = await this.client.chat.completions.create(payload);
        const content = extractOpenAIMessageContent(res);
        if (!content) {
          console.error('[OpenAIAdapter] No content returned from OpenAI API');
          throw new Error('Empty content from OpenAI');
        }
        return content;
      } catch (err) {
        if (!shouldRetry(err, attempt, maxRetries)) {
          console.error(
            '[OpenAIAdapter] OpenAI API error (fatal, no retry):',
            err,
          );
          throw err instanceof Error ? err : new Error('Unknown error');
        }
        const retryAfterMs = parseRetryAfter(getOpenAIErrorHeaders(err));
        const delay = computeDelay(attempt, retryAfterMs ?? baseBackoffMs);
        console.warn(
          `[OpenAIAdapter] Transient error (${getErrorStatus(err)}). Retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`,
        );
        await sleep(delay);
      }
    }

    throw new Error('Max retries exceeded');
  }
}
