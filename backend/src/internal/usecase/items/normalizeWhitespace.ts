export function normalizeWhitespace(input?: string): string {
  if (!input) return '';
  return input.replace(/\s+/g, ' ').trim();
}
