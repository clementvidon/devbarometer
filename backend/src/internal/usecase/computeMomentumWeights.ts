import type { RelevantItem, WeightedItem } from '../core/entity/Item.ts';

const BASE_MOMENTUM_WEIGHT = 1;

function isNew(prevRaw: number | undefined): boolean {
  return prevRaw === undefined;
}

function noPositiveDelta(todayRaw: number, prevRaw: number): boolean {
  return todayRaw <= prevRaw;
}

export function computeMomentumWeights(
  today: RelevantItem[],
  prev: RelevantItem[] | null,
): WeightedItem[] {
  const prevMap = new Map<string, number>(
    (prev ?? []).map((i) => [i.source, i.score ?? 0]),
  );

  return today.map((it) => {
    const todayRaw = it.score ?? 0;
    const prevRaw = prevMap.get(it.source);

    if (isNew(prevRaw)) {
      return { ...it, weight: BASE_MOMENTUM_WEIGHT };
    }

    if (noPositiveDelta(todayRaw, prevRaw as number)) {
      return { ...it, weight: BASE_MOMENTUM_WEIGHT };
    }

    const delta = todayRaw - (prevRaw as number);
    const momentum = BASE_MOMENTUM_WEIGHT + Math.log1p(delta);
    return { ...it, weight: momentum };
  });
}
