import type { RelevantItem } from '../../entities';

/**
 * Sanitize `score` fields in current and previous RelevantItems.
 *
 * - Replaces non-finite values (`NaN`, `Infinity`, `-Infinity`) with `0`.
 * - Returns sanitized copies of both arrays. No logging in domain layer.
 */
export function sanitizeScores(
  items: RelevantItem[],
  prevItems: RelevantItem[],
) {
  const sanitize = (arr: RelevantItem[]) =>
    arr.map((i) => (Number.isFinite(i.score) ? i : { ...i, score: 0 }));

  const safeItems = sanitize(items);
  const safePrevItems = sanitize(prevItems);

  return { safeItems, safePrevItems };
}
