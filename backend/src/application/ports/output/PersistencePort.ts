import type {
  PipelineSnapshot,
  SnapshotData,
} from '../../../domain/value-objects/PipelineSnapshot';

/**
 * Persistence for pipeline snapshots.
 *
 * Contract (interface-wide):
 * - Timestamps are respected (no override); operations aim to be atomic.
 * - `id` is assigned by the adapter; reads are newest-first.
 */

export interface PersistencePort {
  /**
   * Persist a snapshot at an explicit timestamp.
   *
   * Contract:
   * - `createdAtISO` must be a valid ISO 8601 datetime (UTC recommended).
   * - Adapter must not override the provided timestamp.
   * - Operation should be atomic: either the whole snapshot is stored or none.
   * - The adapter assigns the snapshot `id`.
   */
  storeSnapshotAt(createdAtISO: string, snapshot: SnapshotData): Promise<void>;

  /**
   * Return all persisted snapshots, ordered newest-first (strictly descending by createdAt).
   *
   * Contract:
   * - snapshots[0] is the most recent.
   * - Array is sorted strictly by createdAt descending.
   * - `createdAt` must be an ISO 8601 string.
   */
  getSnapshots(): Promise<PipelineSnapshot[]>;
}
