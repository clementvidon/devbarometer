import type { RelevantItem, WeightedItem } from '../../entities';

export interface MomentumParams {
  baseWeight: number;
}

function isNew(prevRaw: number | undefined): boolean {
  return prevRaw === undefined;
}

function noPositiveDelta(todayRaw: number, prevRaw: number): boolean {
  return todayRaw <= prevRaw;
}

export function computeMomentumWeight(
  today: RelevantItem[],
  prev: RelevantItem[] = [],
  params: MomentumParams,
): WeightedItem[] {
  const prevMap = new Map<string, number>(
    prev.map((item) => [item.source, item.score]),
  );
  const { baseWeight } = params;

  return today.map((item) => {
    const todayRaw = item.score;
    const prevRaw = prevMap.get(item.source);

    if (isNew(prevRaw)) {
      return { ...item, weight: baseWeight };
    }

    if (noPositiveDelta(todayRaw, prevRaw as number)) {
      return { ...item, weight: baseWeight };
    }

    const delta = todayRaw - (prevRaw as number);
    const momentum = baseWeight + Math.log1p(delta);
    return { ...item, weight: momentum };
  });
}
