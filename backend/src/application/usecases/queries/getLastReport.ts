import { ReportSchema } from '@devbarometer/shared';
import type { Report } from '../../../domain/entities';
import type { PersistencePort } from '../../ports/output/PersistencePort';

function mapReport(report: Report): Report {
  return ReportSchema.parse({
    text: report.text,
    emoji: report.emoji,
  });
}

export async function getLastReport(
  persistence: PersistencePort,
): Promise<Report | null> {
  const snapshots = await persistence.getSnapshots();
  if (snapshots.length === 0) return null;
  return mapReport(snapshots[0].report);
}
