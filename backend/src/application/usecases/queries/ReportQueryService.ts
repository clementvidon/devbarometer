import type {
  AggregatedEmotionProfileDto,
  HeadlineDto,
} from '@devbarometer/shared/dto';
import type { EmotionProfile, Report } from '../../../domain/entities';
import type { PersistencePort } from '../../../internal/core/port/PersistencePort';
import type { QueryPort } from '../../../internal/core/port/QueryPort';
import { getAggregatedProfiles } from './getAggregatedProfiles';
import { getLastProfiles } from './getLastProfiles';
import { getLastReport } from './getLastReport';
import { getTopHeadlines } from './getTopHeadlines';

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
  getTopHeadlines(limit?: number): Promise<HeadlineDto[]> {
    return getTopHeadlines(this.persistence, limit);
  }
}
