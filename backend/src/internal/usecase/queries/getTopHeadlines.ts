import type { HeadlineDto } from '@devbarometer/shared';
import type { PersistencePort } from '../../core/port/PersistencePort';
import { formatFloat } from '../../lib/number/formatFloat';

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
    .map((item) => ({
      title: item.title,
      weight: formatFloat(item.weight, 0),
      source: item.source,
    }));
}
