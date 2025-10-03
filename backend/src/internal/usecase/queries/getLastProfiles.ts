import type { EmotionProfile } from '../../core/entity/EmotionProfile';
import type { PersistencePort } from '../../core/port/PersistencePort';

export async function getLastProfiles(
  persistence: PersistencePort,
): Promise<EmotionProfile[] | null> {
  const snapshots = await persistence.getSnapshots();
  return snapshots[0]?.emotionProfilePerItem ?? null;
}
