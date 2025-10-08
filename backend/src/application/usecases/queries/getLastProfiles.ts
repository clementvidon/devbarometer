import type { EmotionProfile } from '../../../domain/entities';
import type { PersistencePort } from '../../../internal/core/port/PersistencePort';

export async function getLastProfiles(
  persistence: PersistencePort,
): Promise<EmotionProfile[] | null> {
  const snapshots = await persistence.getSnapshots();
  return snapshots[0]?.emotionProfilePerItem ?? null;
}
