import type { EmotionProfile } from '../../core/entity/EmotionProfile.ts';
import type { Report } from '../../core/entity/Report.ts';
import type { PersistencePort } from '../../core/port/PersistencePort.ts';
import type { QueryPort } from '../../core/port/QueryPort.ts';
import type { HeadlineInfo } from '../../core/types/HeadlineInfo.ts';
import type { AggregatedEmotionProfileDto } from './dto.ts';
import { getAggregatedProfiles } from './getAggregatedProfiles.ts';
import { getLastProfiles } from './getLastProfiles.ts';
import { getLastReport } from './getLastReport.ts';
import { getTopHeadlines } from './getTopHeadlines.ts';

export class QueryService implements QueryPort {
  constructor(private readonly persistence: PersistencePort) {}

  async getLastReport(): Promise<Report | null> {
    return getLastReport(this.persistence);
  }
  getLastProfiles(): Promise<EmotionProfile[] | null> {
    return getLastProfiles(this.persistence);
  }
  getAggregatedProfiles(): Promise<AggregatedEmotionProfileDto[]> {
    return getAggregatedProfiles(this.persistence);
  }
  getTopHeadlines(limit?: number): Promise<HeadlineInfo[]> {
    return getTopHeadlines(this.persistence, limit);
  }
}
