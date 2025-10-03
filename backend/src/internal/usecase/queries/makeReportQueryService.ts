import type { PersistencePort } from '../../core/port/PersistencePort';
import type { QueryPort } from '../../core/port/QueryPort';
import { QueryService } from './ReportQueryService';

export function makeReportQueryService(
  persistence: PersistencePort,
): QueryPort {
  return new QueryService(persistence);
}
