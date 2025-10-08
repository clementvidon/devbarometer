import type { PersistencePort } from '../../../internal/core/port/PersistencePort';
import type { QueryPort } from '../../../internal/core/port/QueryPort';
import { QueryService } from './ReportQueryService';

export function makeReportQueryService(
  persistence: PersistencePort,
): QueryPort {
  return new QueryService(persistence);
}
