import type { Item } from '../../domain/entities';

/**
 * Provides raw items for the pipeline.
 *
 * Contract (interface-wide):
 * - Returns finite, non-mutated data; stable within a single run.
 * - Scores are non-negative; order is not required.
 * - If `createdAt` is null, the agent will use the current time.
 */
export interface ItemsProviderPort {
  /** Finite list of Items (non-negative `score`; no side effects). */
  getItems(): Promise<Item[]>;
  /** Stable, human-readable source label (URI-like recommended). */
  getLabel(): string;
  /** ISO 8601 string or null to defer to the agent timestamp. */
  getCreatedAt(): string | null;
}
