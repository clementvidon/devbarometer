export function stripCodeFences(raw: string): string {
  return raw
    .split('\n')
    .filter((line) => !line.trim().startsWith('```'))
    .join('\n')
    .trim();
}
