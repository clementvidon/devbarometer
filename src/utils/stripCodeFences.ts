/**
 * Remove Markdown code-block fences (``` or ```lang) from a raw string while
 * preserving the inner content and original line breaks.
 */
export function stripCodeFences(raw: string): string {
  return raw
    .split('\n')
    .filter((line) => !line.trim().startsWith('```'))
    .join('\n')
    .trim();
}
