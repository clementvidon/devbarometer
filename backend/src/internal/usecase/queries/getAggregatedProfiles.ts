import type { AggregatedEmotionProfile } from '../../core/entity/EmotionProfile.ts';
import type { PersistencePort } from '../../core/port/PersistencePort.ts';

export async function getAggregatedProfiles(
  persistence: PersistencePort,
): Promise<
  {
    createdAt: string;
    emotions: AggregatedEmotionProfile['emotions'];
    tonalities: AggregatedEmotionProfile['tonalities'];
    totalWeight: number;
  }[]
> {
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
    .map((s) => ({
      createdAt: s.createdAt,
      emotions: s.aggregatedEmotionProfile.emotions,
      tonalities: s.aggregatedEmotionProfile.tonalities,
      totalWeight: s.aggregatedEmotionProfile.totalWeight,
    }));
}
