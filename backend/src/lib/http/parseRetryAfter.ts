export function parseRetryAfter(
  headers?: Record<string, string>,
): number | null {
  const raw = headers?.['retry-after'];
  if (!raw) return null;
  const secs = Number(raw);
  if (!isNaN(secs)) return secs * 1000;
  const date = Date.parse(raw);
  return isNaN(date) ? null : Math.max(0, date - Date.now());
}
