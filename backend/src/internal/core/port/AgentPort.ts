/**
 * Agent orchestration port for capturing a single pipeline snapshot.
 *
 * Contract:
 * - Executes full pipeline: fetch -> relevance -> weighting -> profiling -> aggregation -> reporting -> persist.
 * - Performs external I/O (network/DB) and other side-effects (persistence, logging).
 * - Must not mutate input objects; errors propagate to the caller.
 */
export interface AgentPort {
  captureSnapshot(): Promise<void>;
}
