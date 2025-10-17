import {
  AggregatedEmotionProfileDtoSchema,
  type AggregatedEmotionProfileDto,
} from '@devbarometer/shared/dtos';
import type { AggregatedEmotionProfile } from '../../../domain/entities';
import type { PersistencePort } from '../../ports/output/PersistencePort';

function mapAggregateToDto(
  createdAt: string,
  aggregate: AggregatedEmotionProfile,
): AggregatedEmotionProfileDto {
  return AggregatedEmotionProfileDtoSchema.parse({
    createdAt,
    count: aggregate.count,
    totalWeight: aggregate.totalWeight,
    emotions: aggregate.emotions,
    tonalities: aggregate.tonalities,
  });
}

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

    acc.push(mapAggregateToDto(snapshot.createdAt, aggregate));
    return acc;
  }, []);
}
