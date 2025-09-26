import type { PersistencePort } from '../../core/port/PersistencePort.ts';
import type { HeadlineInfo } from '../../core/types/HeadlineInfo.ts';
import { formatFloat } from '../../lib/number/formatFloat.ts';

export async function getTopHeadlines(
  persistence: PersistencePort,
  limit = 10,
): Promise<HeadlineInfo[]> {
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
