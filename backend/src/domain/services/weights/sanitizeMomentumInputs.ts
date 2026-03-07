import type { RelevantItem } from '../../entities';

export function sanitizeMomentumInputs(
  items: RelevantItem[],
  prevItems: RelevantItem[],
) {
  const sanitize = (arr: RelevantItem[]) =>
    arr.map((i) => (Number.isFinite(i.score) ? i : { ...i, score: 0 }));

  const safeItems = sanitize(items);
  const safePrevItems = sanitize(prevItems);

  return { safeItems, safePrevItems };
}
