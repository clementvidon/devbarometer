import type { RelevantItem } from '../../core/entity';
import type { PersistencePort } from '../../core/port/PersistencePort';

export async function getRelevantItemsBefore(
  createdAtISO: string,
  persistence: PersistencePort,
): Promise<RelevantItem[]> {
  const snapshots = await persistence.getSnapshots();
  const target = Date.parse(createdAtISO);

  const prev =
    snapshots
      .filter((s) => Date.parse(s.createdAt) < target)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0] ??
    null;

  return prev?.relevantItems ?? [];
}
