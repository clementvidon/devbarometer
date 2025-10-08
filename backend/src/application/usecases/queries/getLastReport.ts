import type { Report } from '../../../domain/entities';
import type { PersistencePort } from '../../ports/PersistencePort';

export async function getLastReport(
  persistence: PersistencePort,
): Promise<Report | null> {
  const snapshots = await persistence.getSnapshots();
  return snapshots[0]?.report ?? null;
}
