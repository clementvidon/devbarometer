import { type AggregatedEmotionProfileDto } from '@devbarometer/shared';
import type { PersistencePort } from '../../core/port/PersistencePort';

export async function getAggregatedProfiles(
  persistence: PersistencePort,
): Promise<AggregatedEmotionProfileDto[]> {
  const snapshots = await persistence.getSnapshots();

  return snapshots.reduce<AggregatedEmotionProfileDto[]>((acc, snapshot) => {
    const aggregate = snapshot.aggregatedEmotionProfile;
    if (!aggregate) {
      console.warn(
        `[getAggregatedEmotionProfiles] Skipping snapshot without aggregate: ${snapshot.createdAt}`,
      );
      return acc;
    }

    acc.push({ createdAt: snapshot.createdAt, ...aggregate });
    return acc;
  }, []);
}
