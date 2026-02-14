import type OpenAI from 'openai';
import type {
  ChatCompletion,
  ChatCompletionCreateParamsNonStreaming,
} from 'openai/resources';
import type {
  LlmMessage,
  LlmPort,
  LlmRunOptions,
} from '../../application/ports/output/LlmPort';
import type { LoggerPort } from '../../application/ports/output/LoggerPort';
import { sleep } from '../../lib/async/sleep';
import { withTimeout } from '../../lib/async/withTimeout';
import { parseRetryAfter } from '../../lib/http/parseRetryAfter';

export interface OpenAIOptions {
  maxRetries: number;
  baseBackoffMs: number;
  requestTimeoutMs: number;
}

const DEFAULT_OPENAI_OPTIONS = {
  /** How many times to retry transient errors */
  maxRetries: 3,
  /** Base backoff duration (ms) before multiplying by attempt */
  baseBackoffMs: 1200,
  /** Per-request timeout for the OpenAI API call */
  requestTimeoutMs: 30000,
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

export function linearBackoffMs(
  attempt: number,
  baseMs = 1200,
  jitterRangeMs = 250,
): number {
  const jitter = Math.floor(Math.random() * jitterRangeMs);
  return baseMs * attempt + jitter;
}

export function computeDelay(
  attempt: number,
  baseDelayMs: number,
  jitterRangeMs = 250,
): number {
  return linearBackoffMs(attempt, baseDelayMs, jitterRangeMs);
}

export function getOpenAIErrorHeaders(
  err: unknown,
): Record<string, string> | undefined {
  return (err as { headers?: Record<string, string> }).headers;
}

export function isRetryableOpenAIError(err: unknown): boolean {
  const e = err as { status?: number; code?: string };
  const isTooManyRequests = e.status === 429;
  const isServerError = typeof e.status === 'number' && e.status >= 500;
  const isRateLimitExceeded = e.code === 'rate_limit_exceeded';
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
  return res.choices[0]?.message.content?.trim() ?? null;
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
  private readonly logger: LoggerPort;

  constructor(
    private readonly client: OpenAI,
    logger: LoggerPort,
    opts: Partial<OpenAIOptions> = {},
  ) {
    this.opts = mergeOpenAIOptions(opts);
    this.logger = logger.child({ module: 'llm.openai' });
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
        const res = await withTimeout(
          this.client.chat.completions.create(payload),
          this.opts.requestTimeoutMs,
        );
        const content = extractOpenAIMessageContent(res);
        if (!content) {
          this.logger.debug('No content returned from OpenAI API', {
            model,
            messageCount: messages.length,
          });
          throw new Error('Empty content from OpenAI');
        }
        return content;
      } catch (err) {
        if (!shouldRetry(err, attempt, maxRetries)) {
          this.logger.debug(
            'OpenAI API error (fatal, no retry)',
            {
              model,
              attempt,
              maxRetries,
              status: getErrorStatus(err),
            },
            err,
          );
          throw err instanceof Error ? err : new Error('Unknown error');
        }
        const retryAfterMs = parseRetryAfter(getOpenAIErrorHeaders(err));
        const delay = computeDelay(attempt, retryAfterMs ?? baseBackoffMs);
        this.logger.debug(
          'OpenAI transient error. Retrying soon',
          {
            status: getErrorStatus(err),
            delayMs: delay,
            retryAfterMs: retryAfterMs ?? null,
            attempt,
            maxRetries,
            model,
          },
          err,
        );
        await sleep(delay);
      }
    }

    throw new Error('Max retries exceeded');
  }
}
