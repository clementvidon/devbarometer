import type { RelevantItem } from '../core/entity/Item.ts';

function isNew(prevRaw: number | undefined): boolean {
  return prevRaw === undefined;
}

function noPositiveDelta(todayRaw: number, prevRaw: number): boolean {
  return todayRaw <= prevRaw;
}

export function computeMomentumWeights(
  today: RelevantItem[],
  prev: RelevantItem[] | null,
): RelevantItem[] {
  const prevMap = new Map<string, number>(
    (prev ?? []).map((i) => [i.source, i.weight ?? 0]),
  );

  return today.map((it) => {
    const todayRaw = it.weight ?? 0;
    const prevRaw = prevMap.get(it.source);

    if (isNew(prevRaw)) {
      return { ...it, weight: 1 };
    }

    if (noPositiveDelta(todayRaw, prevRaw as number)) {
      return { ...it, weight: 1 };
    }

    const delta = todayRaw - (prevRaw as number); // Δ > 0 garanti ici
    const momentum = 1 + Math.log1p(delta);
    return { ...it, weight: momentum };
  });
}
