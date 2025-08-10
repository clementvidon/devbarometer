import type { RawEntry } from '../../types/Chart.ts';
import { COLOR_MAP } from './config.ts';
import { dateFmtTooltip } from './formatters.ts';

export type Point = {
  dateLabel: string;
  createdAt: string;
} & Record<keyof typeof COLOR_MAP, number>;

export function parseRaw(raw: RawEntry[]): Point[] {
  const keys = Object.keys(COLOR_MAP) as (keyof typeof COLOR_MAP)[];

  return raw
    .slice()
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
    .map((item) => {
      const base = {} as Record<keyof typeof COLOR_MAP, number>;
      for (const k of keys) base[k] = +(item.emotions[k] ?? 0);
      return {
        dateLabel: dateFmtTooltip.format(new Date(item.createdAt)),
        createdAt: item.createdAt,
        ...base,
      };
    });
}

export function toCumulative(data: Point[]): Point[] {
  const keys = Object.keys(COLOR_MAP) as (keyof typeof COLOR_MAP)[];
  const totals = Object.fromEntries(keys.map((k) => [k, 0])) as Record<
    keyof typeof COLOR_MAP,
    number
  >;

  return data.map((p) => {
    const out = { ...p };
    keys.forEach((k) => {
      totals[k] += p[k];
      out[k] = +totals[k].toFixed(3);
    });
    return out;
  });
}
