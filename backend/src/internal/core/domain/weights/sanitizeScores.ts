import type { RelevantItem } from '../../entity/Item.ts';

/**
 * Sanitize `score` fields in current and previous RelevantItems.
 *
 * - Replaces non-finite values (`NaN`, `Infinity`, `-Infinity`) with `0`.
 * - Logs a warning with a sample of offending items (up to 5).
 * - Returns sanitized copies of both arrays.
 */
export function sanitizeScores(
  items: RelevantItem[],
  prevItems: RelevantItem[],
) {
  const sanitize = (arr: RelevantItem[], fieldName = 'score') => {
    const nonFinite = arr.filter((i) => !Number.isFinite(i.score));
    if (nonFinite.length > 0) {
      const sample = nonFinite
        .slice(0, 5)
        .map((i) => `${i.source}=${String(i.score)}`)
        .join(', ');
      console.warn(
        `[MomentumWeightsStrategy] ${nonFinite.length} non-finite ${fieldName}(s) found — sanitized to 0. Samples: ${sample}`,
      );
    }
    return arr.map((i) => (Number.isFinite(i.score) ? i : { ...i, score: 0 }));
  };

  const safeItems = sanitize(items, 'score');
  const safePrevItems = sanitize(prevItems, 'prev.score');

  return { safeItems, safePrevItems };
}
