import type { AggregatedEmotionProfile } from '../../core/entity/EmotionProfile.ts';
import type { PersistencePort } from '../../core/port/PersistencePort.ts';

export async function getAggregatedProfiles(
  persistence: PersistencePort,
): Promise<AggregatedEmotionProfile[]> {
  const snapshots = await persistence.getSnapshots();
  return snapshots
    .filter((s) => {
      const ok = !!s.aggregatedEmotionProfile;
      if (!ok) {
        console.warn(
          `[getAggregatedEmotionProfiles] Skipping snapshot without aggregate: ${s.createdAt}`,
        );
      }
      return ok;
    })
    .map((s) => s.aggregatedEmotionProfile);
}
