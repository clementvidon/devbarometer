import {
  AggregatedSentimentProfileDtoSchema,
  type AggregatedSentimentProfileDto,
} from '@devbarometer/shared/dtos';
import type { AggregatedSentimentProfile } from '../../../domain/entities';
import type { PersistencePort } from '../../ports/output/PersistencePort';

function mapAggregateToDto(
  createdAt: string,
  aggregate: AggregatedSentimentProfile,
): AggregatedSentimentProfileDto {
  return AggregatedSentimentProfileDtoSchema.parse({
    createdAt,
    count: aggregate.count,
    totalWeight: aggregate.totalWeight,
    emotions: aggregate.emotions,
    tonalities: aggregate.tonalities,
  });
}

export async function getAggregatedProfiles(
  persistence: PersistencePort,
): Promise<AggregatedSentimentProfileDto[]> {
  const snapshots = await persistence.getSnapshots();

  return snapshots.reduce<AggregatedSentimentProfileDto[]>((acc, snapshot) => {
    const aggregate = snapshot.aggregatedSentimentProfile;
    acc.push(mapAggregateToDto(snapshot.createdAt, aggregate));
    return acc;
  }, []);
}
