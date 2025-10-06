import type { RelevantItem, WeightedItem } from '../../entity';
import type { MomentumOptions } from './MomentumWeightsStrategy';

function isNew(prevRaw: number | undefined): boolean {
  return prevRaw === undefined;
}

function noPositiveDelta(todayRaw: number, prevRaw: number): boolean {
  return todayRaw <= prevRaw;
}

/**
 * Compute momentum weights:
 * - new item or non-positive delta -> baseWeight
 * - positive delta -> baseWeight + log1p(delta)
 * Input arrays are not mutated.
 */
export function computeMomentum(
  today: RelevantItem[],
  prev: RelevantItem[] = [],
  opts: MomentumOptions,
): WeightedItem[] {
  const prevMap = new Map<string, number>(
    prev.map((i) => [i.source, i.score ?? 0]),
  );
  const { baseWeight } = opts;

  return today.map((it) => {
    const todayRaw = it.score;
    const prevRaw = prevMap.get(it.source);

    if (isNew(prevRaw)) {
      return { ...it, weight: baseWeight };
    }

    if (noPositiveDelta(todayRaw, prevRaw as number)) {
      return { ...it, weight: baseWeight };
    }

    const delta = todayRaw - (prevRaw as number);
    const momentum = baseWeight + Math.log1p(delta);
    return { ...it, weight: momentum };
  });
}
