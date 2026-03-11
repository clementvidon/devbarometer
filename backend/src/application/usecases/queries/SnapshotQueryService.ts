import type { Report } from '@devbarometer/shared';
import type {
  AggregatedSentimentProfileDto,
  HeadlineDto,
} from '@devbarometer/shared/dtos';
import type { SnapshotQueryPort } from '../../ports/input/SnapshotQueryPort';
import type { PersistencePort } from '../../ports/output/PersistencePort';
import { getAggregatedProfiles } from './getAggregatedProfiles';
import { getLastReport } from './getLastReport';
import { getTopHeadlines } from './getTopHeadlines';

export class SnapshotQueryService implements SnapshotQueryPort {
  constructor(private readonly persistence: PersistencePort) {}

  async getLastReport(): Promise<Report | null> {
    return getLastReport(this.persistence);
  }
  getAggregatedProfiles(): Promise<AggregatedSentimentProfileDto[]> {
    return getAggregatedProfiles(this.persistence);
  }
  getTopHeadlines(limit?: number): Promise<HeadlineDto[]> {
    return getTopHeadlines(this.persistence, limit);
  }
}
