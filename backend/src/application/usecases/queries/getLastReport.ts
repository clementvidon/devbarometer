import { type ReportDto, ReportDtoSchema } from '@devbarometer/shared/dtos';

import type { Report } from '../../../domain/entities';
import type { PersistencePort } from '../../ports/output/PersistencePort';

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
  if (snapshots.length === 0) return null;
  return mapReportDto(snapshots[0].report);
}
