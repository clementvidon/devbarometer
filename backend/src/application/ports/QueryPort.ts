import type {
  AggregatedEmotionProfileDto,
  HeadlineDto,
} from '@devbarometer/shared/dto';
import type { EmotionProfile, Report } from '../../domain/entities';

/**
 * Read-only query port for application-level snapshot data.
 *
 * Contract:
 * - Returns latest report, profiles, aggregates and top headlines (pure reads).
 * - No side-effects: callers manage caching/retry/authorization.
 * - Implementations must not mutate returned objects; stable shapes expected.
 */
export interface QueryPort {
  getLastReport(): Promise<Report | null>;
  getLastProfiles(): Promise<EmotionProfile[] | null>;
  getAggregatedProfiles(): Promise<AggregatedEmotionProfileDto[]>;
  getTopHeadlines(limit?: number): Promise<HeadlineDto[]>;
}
