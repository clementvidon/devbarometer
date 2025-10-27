import type { FetchPort } from '../../application/ports/output/FetchPort';
import type { LoggerPort } from '../../application/ports/output/LoggerPort';
import { sleep } from '../async/sleep';
import { withTimeout } from '../async/withTimeout';
import { truncate } from '../log/truncate';
import { MAX_RETRIES, TIMEOUT_MS } from './constants';
import { isJsonResponse } from './isJsonResponse';
import { parseRetryAfter } from './parseRetryAfter';

export interface FetchWithRetryOptions {
  maxRetries: number;
  timeoutMs: number;
  shouldRetry: (res: Response) => boolean;
  computeDelay: (attempt: number, res?: Response, err?: unknown) => number;
}

export function exponentialBackoffMs(
  attempt: number,
  baseMs = 100,
  jitterRangeMs = 100,
): number {
  const jitter = Math.floor(Math.random() * jitterRangeMs);
  return Math.pow(2, attempt) * baseMs + jitter;
}

export const DEFAULT_FETCH_WITH_RETRY_OPTIONS = {
  maxRetries: MAX_RETRIES,
  timeoutMs: TIMEOUT_MS,
  shouldRetry: (res: Response) => res.status === 429 || res.status >= 500,
  computeDelay: (attempt: number, res?: Response) => {
    if (res) {
      const retryAfter = getRetryAfterMsFromHeaders(res.headers);
      if (retryAfter) return retryAfter;
    }
    return exponentialBackoffMs(attempt, 100, 100);
  },
} as const satisfies FetchWithRetryOptions;

export function mergeFetchWithRetryOptions(
  opts: Partial<FetchWithRetryOptions> = {},
): FetchWithRetryOptions {
  return { ...DEFAULT_FETCH_WITH_RETRY_OPTIONS, ...opts };
}

export type FetchErrorCode =
  | 'TIMEOUT'
  | 'NETWORK'
  | 'AUTH'
  | 'HTTP'
  | 'NON_JSON'
  | 'RATE_LIMIT';

export type FetchResult =
  | { ok: true; res: Response }
  | {
      ok: false;
      code: FetchErrorCode;
      retryable: boolean;
      status?: number;
      retryAfterMs?: number;
      error?: unknown;
    };

function isTimeoutError(err: unknown): boolean {
  return err instanceof Error && err.message === 'Timeout';
}

function getRetryAfterMsFromHeaders(headers: Headers): number | undefined {
  const raw = headers.get('Retry-After');
  if (!raw) return undefined;
  const ms = parseRetryAfter({ 'retry-after': raw });
  return ms ?? undefined;
}

export async function fetchWithRetry(
  fetcher: FetchPort,
  url: string,
  init: RequestInit,
  opts: Partial<FetchWithRetryOptions> = {},
  logger?: LoggerPort,
): Promise<FetchResult> {
  const { maxRetries, timeoutMs, shouldRetry, computeDelay } =
    mergeFetchWithRetryOptions(opts);
  const log = logger?.child({ module: 'lib.fetch' });

  let lastError: unknown;
  let lastErrorCode: FetchErrorCode | undefined;
  let lastStatus: number | undefined;
  let lastRetryAfterMs: number | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await withTimeout(fetcher.fetch(url, init), timeoutMs);

      if (res.status === 401 || res.status === 403) {
        log?.error('HTTP auth error (fatal, no retry)', {
          url,
          status: res.status,
        });
        return {
          ok: false,
          code: 'AUTH',
          retryable: false,
          status: res.status,
        };
      }

      if (shouldRetry(res)) {
        const delay = computeDelay(attempt, res);
        lastStatus = res.status;
        lastErrorCode = res.status === 429 ? 'RATE_LIMIT' : 'HTTP';
        lastRetryAfterMs = getRetryAfterMsFromHeaders(res.headers);
        log?.warn('HTTP transient error. Retrying soon', {
          url,
          status: res.status,
          delayMs: delay,
          retryAfterMs: lastRetryAfterMs ?? null,
          attempt: attempt + 1,
          maxRetries,
        });
        await sleep(delay);
        continue;
      }

      if (res.status >= 400) {
        const msg = await res.clone().text();
        log?.error('HTTP error', {
          url,
          status: res.status,
          body: truncate(msg),
        });
        return {
          ok: false,
          code: res.status === 429 ? 'RATE_LIMIT' : 'HTTP',
          retryable: res.status === 429 ? true : false,
          status: res.status,
          retryAfterMs: getRetryAfterMsFromHeaders(res.headers),
        };
      }

      if (!isJsonResponse(res)) {
        const html = await res.clone().text();
        log?.warn('Non-JSON response', {
          url,
          status: res.status,
          body: truncate(html, 200),
        });
        return {
          ok: false,
          code: 'NON_JSON',
          retryable: false,
          status: res.status,
        };
      }

      return { ok: true, res };
    } catch (err) {
      log?.error('HTTP attempt failed', {
        url,
        attempt: attempt + 1,
        maxRetries,
        error: err,
      });
      lastError = err;
      lastErrorCode = isTimeoutError(err) ? 'TIMEOUT' : 'NETWORK';
      const delay = computeDelay(attempt, undefined, err);
      await sleep(delay);
    }
  }

  log?.error('HTTP failed after all attempts', {
    url,
    attempts: maxRetries,
    lastStatus: lastStatus ?? null,
    lastErrorCode: lastErrorCode ?? null,
    retryAfterMs: lastRetryAfterMs ?? null,
  });

  if (lastErrorCode) {
    return {
      ok: false,
      code: lastErrorCode,
      retryable: true,
      error: lastError,
    };
  }

  if (typeof lastStatus === 'number') {
    const code: FetchErrorCode = lastStatus === 429 ? 'RATE_LIMIT' : 'HTTP';
    return {
      ok: false,
      code,
      retryable: lastStatus === 429 || lastStatus >= 500,
      status: lastStatus,
      retryAfterMs: lastRetryAfterMs,
    };
  }

  return { ok: false, code: 'NETWORK', retryable: true };
}
