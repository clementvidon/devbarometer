import type { FetchPort } from '../../application/ports/output/FetchPort';
import type { LoggerPort } from '../../application/ports/output/LoggerPort';
import { sleep } from '../async/sleep';
import { withTimeout } from '../async/withTimeout';
import { truncate } from '../log/truncate';
import { MAX_RETRIES, TIMEOUT_MS } from './constants';
import { isJsonResponse } from './isJsonResponse';

export interface FetchWithRetryOptions {
  maxRetries: number;
  timeoutMs: number;
  shouldRetry: (res: Response) => boolean;
  computeDelay: (attempt: number, res?: Response, err?: unknown) => number;
}

export const DEFAULT_FETCH_WITH_RETRY_OPTIONS = {
  maxRetries: MAX_RETRIES,
  timeoutMs: TIMEOUT_MS,
  shouldRetry: (res: Response) => res.status === 429 || res.status >= 500,
  computeDelay: (attempt: number) => Math.pow(2, attempt) * 100,
} as const satisfies FetchWithRetryOptions;

export function mergeFetchWithRetryOptions(
  opts: Partial<FetchWithRetryOptions> = {},
): FetchWithRetryOptions {
  return { ...DEFAULT_FETCH_WITH_RETRY_OPTIONS, ...opts };
}

export async function fetchWithRetry(
  fetcher: FetchPort,
  url: string,
  init: RequestInit,
  opts: Partial<FetchWithRetryOptions> = {},
  logger?: LoggerPort,
): Promise<Response | null> {
  const { maxRetries, timeoutMs, shouldRetry, computeDelay } =
    mergeFetchWithRetryOptions(opts);
  const log = logger?.child({ module: 'lib.fetch' });

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await withTimeout(fetcher.fetch(url, init), timeoutMs);

      if (res.status === 401 || res.status === 403) {
        log?.error(`[fetchWithRetry] ${String(res.status)} fatal (no retry)`);
        return null;
      }

      if (shouldRetry(res)) {
        const delay = computeDelay(attempt, res);
        log?.warn(
          `[fetchWithRetry] ${String(res.status)} -> retry in ${String(delay)}ms`,
        );
        await sleep(delay);
        continue;
      }

      if (res.status >= 400) {
        const msg = await res.text();
        log?.error(
          `[fetchWithRetry] ${String(res.status)} Error:\n${truncate(msg)}`,
        );
        return null;
      }

      if (!isJsonResponse(res)) {
        const html = await res.text();
        log?.warn(
          `[fetchWithRetry] Non-JSON @ ${url}:\n${truncate(html, 200)}`,
        );
        return null;
      }

      return res;
    } catch (err) {
      log?.error(`[fetchWithRetry] ${url} attempt ${String(attempt + 1)}:`, {
        error: err,
      });
      const delay = computeDelay(attempt, undefined, err);
      await sleep(delay);
    }
  }

  log?.error(
    `[fetchWithRetry] ${url} failed after ${String(maxRetries)} attempts.`,
  );
  return null;
}
