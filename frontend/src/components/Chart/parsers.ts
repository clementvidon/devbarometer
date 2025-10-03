import type { RawEntry } from '../../types/Chart';
import { EMOTION_COLORS } from './config';
import { dateFmtTooltip } from './formatters';

export type EmotionPoint = {
  dateLabel: string;
  createdAt: string;
} & Record<keyof typeof EMOTION_COLORS, number>;

export function parseEmotions(raw: RawEntry[]): EmotionPoint[] {
  const keys = Object.keys(EMOTION_COLORS) as (keyof typeof EMOTION_COLORS)[];
  return raw
    .slice()
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
    .map((item) => {
      const base = {} as Record<keyof typeof EMOTION_COLORS, number>;
      for (const k of keys) base[k] = +(item.emotions[k] ?? 0);
      return {
        dateLabel: dateFmtTooltip.format(new Date(item.createdAt)),
        createdAt: item.createdAt,
        ...base,
      };
    });
}

type RawEntryWithTonalities = RawEntry & {
  tonalities?: {
    positive?: number;
    negative?: number;
    positive_surprise?: number;
    negative_surprise?: number;
    optimistic_anticipation?: number;
    pessimistic_anticipation?: number;
  };
};

export type TonalityPoint = {
  createdAt: string;
  polarity: number;
  surprise: number;
  anticipation: number;
};

export function parseTonalities(raw: RawEntry[]): TonalityPoint[] {
  return raw
    .slice()
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
    .map((item) => {
      const t = (item as RawEntryWithTonalities).tonalities;
      const pos = t?.positive ?? 0;
      const neg = t?.negative ?? 0;
      const posSurp = t?.positive_surprise ?? 0;
      const negSurp = t?.negative_surprise ?? 0;
      const optAnt = t?.optimistic_anticipation ?? 0;
      const pessAnt = t?.pessimistic_anticipation ?? 0;

      return {
        createdAt: item.createdAt,
        polarity: +(pos - neg),
        surprise: +(posSurp - negSurp),
        anticipation: +(optAnt - pessAnt),
      };
    });
}
