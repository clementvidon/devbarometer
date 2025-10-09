import type {
  AggregatedEmotionProfileDto,
  HeadlineDto,
  ReportDto,
} from '@devbarometer/shared/dtos';

/**
 * Read-only query port for application-level snapshot data.
 *
 * Contract:
 * - Returns latest report, profiles, aggregates and top headlines (pure reads).
 * - No side-effects: callers manage caching/retry/authorization.
 * - Implementations must not mutate returned objects; stable shapes expected.
 */
export interface SnapshotQueryPort {
  getLastReport(): Promise<ReportDto | null>;
  getAggregatedProfiles(): Promise<AggregatedEmotionProfileDto[]>;
  getTopHeadlines(limit?: number): Promise<HeadlineDto[]>;
}
