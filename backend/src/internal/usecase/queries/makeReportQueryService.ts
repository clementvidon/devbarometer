import type { PersistencePort } from '../../core/port/PersistencePort.ts';
import type { QueryPort } from '../../core/port/QueryPort.ts';
import { QueryService } from './ReportQueryService.ts';

export function makeReportQueryService(
  persistence: PersistencePort,
): QueryPort {
  return new QueryService(persistence);
}
