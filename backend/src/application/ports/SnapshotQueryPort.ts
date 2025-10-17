import type {
  AggregatedEmotionProfileDto,
  HeadlineDto,
  ReportDto,
} from '@devbarometer/shared/dtos';

/**
 * Read-only query port for application-level snapshot data.
 *
 * Contract (interface-wide):
 * - Pure reads only; no side effects; immutable results.
 * - DTO shapes are stable; callers handle caching/retries.
 */
export interface SnapshotQueryPort {
  /** Returns the latest report or null if none. */
  getLastReport(): Promise<ReportDto | null>;
  /** Returns aggregated profiles for all snapshots (newest-first source). */
  getAggregatedProfiles(): Promise<AggregatedEmotionProfileDto[]>;
  /** Returns top headlines from the latest snapshot; `limit` defaults are impl-specific. */
  getTopHeadlines(limit?: number): Promise<HeadlineDto[]>;
}
