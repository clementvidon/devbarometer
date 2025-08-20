import { formatFloat } from './format.ts';

export function logItemsOnePerLine(
  label: string,
  items: { title: string; weight?: number }[],
): void {
  console.log(`<${label}>`);
  for (const it of items) {
    console.log(`weight: ${formatFloat(it.weight)}, title: ${it.title}, `);
  }
}
