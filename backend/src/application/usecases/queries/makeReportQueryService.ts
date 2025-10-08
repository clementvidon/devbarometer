import type { PersistencePort } from '../../ports/PersistencePort';
import type { SnapshotQueryPort } from '../../ports/SnapshotQueryPort';
import { QueryService } from './ReportQueryService';

export function makeReportQueryService(
  persistence: PersistencePort,
): SnapshotQueryPort {
  return new QueryService(persistence);
}
