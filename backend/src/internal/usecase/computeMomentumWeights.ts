import type { RelevantItem } from '../core/entity/Item.ts';

export function computeMomentumWeights(
  today: RelevantItem[],
  yesterday: RelevantItem[] | null,
): RelevantItem[] {
  const yMap = new Map<string, number>(
    yesterday?.map((i) => [i.source, i.weight]),
  );
  return today.map((it) => {
    const prev = yMap.get(it.source) ?? it.weight;
    const d = Math.max(0, it.weight - prev);
    return { ...it, weight: Math.log1p(d) };
  });
}
