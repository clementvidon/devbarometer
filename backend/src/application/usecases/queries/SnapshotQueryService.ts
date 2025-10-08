import type {
  AggregatedEmotionProfileDto,
  HeadlineDto,
} from '@devbarometer/shared/dto';
import type { EmotionProfile, Report } from '../../../domain/entities';
import type { PersistencePort } from '../../ports/PersistencePort';
import type { SnapshotQueryPort } from '../../ports/SnapshotQueryPort';
import { getAggregatedProfiles } from './getAggregatedProfiles';
import { getLastProfiles } from './getLastProfiles';
import { getLastReport } from './getLastReport';
import { getTopHeadlines } from './getTopHeadlines';

export class SnapshotQueryService implements SnapshotQueryPort {
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
