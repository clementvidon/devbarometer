/**
 * Agent orchestration port for capturing a single pipeline snapshot.
 *
 * Contract (interface-wide):
 * - Runs the full pipeline end-to-end (fetch → relevance → weights → profiles → aggregate → report → persist).
 * - May perform external I/O and side effects; does not mutate inputs.
 * - Errors propagate to caller; caller owns retries/scheduling.
 */
export interface AgentPort {
  /** Triggers one full snapshot capture, or rejects on failure. */
  captureSnapshot(): Promise<void>;
}
