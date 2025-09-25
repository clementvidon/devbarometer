import type { Item } from '../entity/Item.ts';

/**
 * Provides raw items for the pipeline.
 *
 * Contract:
 * - `getItems()` returns a finite list of Items with non-negative `score`.
 *   The list should be stable for a given run (idempotent; no side-effects).
 *   Ordering is not required and will not be relied upon.
 * - `getLabel()` returns a stable, human-readable source identifier
 *   (prefer URI-like, e.g. "https://..." or "replay:<id>") used for auditing.
 * - `getCreatedAt()`:
 *     * if non-null => ISO 8601 string (UTC recommended) used as the snapshot timestamp.
 *     * if null     => it must be set to `new Date().toISOString()`.
 */
export interface ItemsProviderPort {
  getItems(): Promise<Item[]>;
  getLabel(): string;
  getCreatedAt(): string | null;
}
