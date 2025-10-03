import type { Report } from '../../core/entity/Report';
import type { PersistencePort } from '../../core/port/PersistencePort';

export async function getLastReport(
  persistence: PersistencePort,
): Promise<Report | null> {
  const snapshots = await persistence.getSnapshots();
  return snapshots[0]?.report ?? null;
}
