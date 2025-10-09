import { type ReportDto, ReportDtoSchema } from '@devbarometer/shared/dtos';

import type { Report } from '../../../domain/entities';
import type { PersistencePort } from '../../ports/PersistencePort';

function mapReportDto(report: Report): ReportDto {
  return ReportDtoSchema.parse({
    text: report.text,
    emoji: report.emoji,
  });
}

export async function getLastReport(
  persistence: PersistencePort,
): Promise<ReportDto | null> {
  const snapshots = await persistence.getSnapshots();

  const report = snapshots[0]?.report;
  if (report === null || report === undefined) return null;
  return mapReportDto(report);
}
