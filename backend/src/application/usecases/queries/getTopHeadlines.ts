import { type HeadlineDto, HeadlineDtoSchema } from '@devbarometer/shared/dtos';
import { formatFloat } from '../../../lib/number/formatFloat';
import type { PersistencePort } from '../../ports/output/PersistencePort';

function mapHeadlineToDto(raw: {
  title: string;
  weight: number;
  source: string;
}): HeadlineDto {
  return HeadlineDtoSchema.parse({
    title: raw.title,
    weight: formatFloat(raw.weight, 0),
    source: raw.source,
  });
}

export async function getTopHeadlines(
  persistence: PersistencePort,
  limit = 10,
): Promise<HeadlineDto[]> {
  const snapshots = await persistence.getSnapshots();
  const latest = snapshots[0];
  if (!latest?.emotionProfilePerItem) return [];

  return latest.emotionProfilePerItem
    .slice()
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit)
    .map(mapHeadlineToDto);
}
