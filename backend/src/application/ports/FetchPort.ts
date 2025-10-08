/**
 * Thin façade over the platform fetch.
 *
 * Contract:
 * - Mirrors native `fetch` semantics: resolves to Response even on HTTP 4xx/5xx; rejects on network errors.
 * - No retries, timeouts, or rate-limit handling here (callers decide).
 * - Must not mutate Request/Response objects passed in/out.
 */
export interface FetchPort {
  fetch(_input: RequestInfo, _init?: RequestInit): Promise<Response>;
}
