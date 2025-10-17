/**
 * Thin façade over the platform fetch.
 *
 * Contract (interface-wide):
 * - Mirrors native fetch semantics (resolve on 4xx/5xx, reject on network errors).
 * - No retries, timeouts, or rate-limit logic; immutable Request/Response.
 */
export interface FetchPort {
  /** Same semantics as global fetch; no extra behaviors. */
  fetch(_input: RequestInfo, _init?: RequestInit): Promise<Response>;
}
