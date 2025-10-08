/**
 * Format a float with fixed decimals.
 * Default: 2 decimals.
 */
export function formatFloat(n: number | undefined, digits = 2): string {
  if (n == null) return '0.00';
  return n.toFixed(digits);
}
