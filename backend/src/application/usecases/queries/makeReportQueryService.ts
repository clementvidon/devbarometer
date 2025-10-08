import type { PersistencePort } from '../../ports/PersistencePort';
import type { QueryPort } from '../../ports/QueryPort';
import { QueryService } from './ReportQueryService';

export function makeReportQueryService(
  persistence: PersistencePort,
): QueryPort {
  return new QueryService(persistence);
}
