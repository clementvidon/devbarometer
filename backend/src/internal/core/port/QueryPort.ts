import type {
  AggregatedEmotionProfile,
  EmotionProfile,
} from '../entity/EmotionProfile.ts';
import type { Report } from '../entity/Report.ts';
import type { HeadlineInfo } from '../types/HeadlineInfo.ts';

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
  getAggregatedProfiles(): Promise<AggregatedEmotionProfile[]>;
  getTopHeadlines(limit?: number): Promise<HeadlineInfo[]>;
}
