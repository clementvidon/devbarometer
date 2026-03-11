import type { Report } from '../../../domain/entities';
import type { PersistencePort } from '../../ports/output/PersistencePort';

export async function getLastReport(
  persistence: PersistencePort,
): Promise<Report | null> {
  const snapshots = await persistence.getSnapshots();
  if (snapshots.length === 0) return null;
  return snapshots[0].report;
}
