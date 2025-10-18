import type { AggregatedEmotionProfileDto } from '@devbarometer/shared';
import { EMOTION_COLORS } from './config';
import { dateFmtTooltip } from './formatters';

export type EmotionSeriesPoint = {
  dateLabel: string;
  createdAt: string;
} & Record<keyof typeof EMOTION_COLORS, number>;

export function buildEmotionSeries(
  profiles: AggregatedEmotionProfileDto[],
): EmotionSeriesPoint[] {
  const keys = Object.keys(EMOTION_COLORS) as (keyof typeof EMOTION_COLORS)[];
  return profiles
    .slice()
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
    .map(({ createdAt, emotions }) => {
      const base = {} as Record<keyof typeof EMOTION_COLORS, number>;
      for (const key of keys) base[key] = emotions[key];
      return {
        dateLabel: dateFmtTooltip.format(new Date(createdAt)),
        createdAt,
        ...base,
      };
    });
}

export type TonalitySeriesPoint = {
  createdAt: string;
  polarity: number;
  surprise: number;
  anticipation: number;
};

export function buildTonalitySeries(
  profiles: AggregatedEmotionProfileDto[],
): TonalitySeriesPoint[] {
  return profiles
    .slice()
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
    .map(({ createdAt, tonalities }) => ({
      createdAt,
      polarity: tonalities.positive - tonalities.negative,
      surprise: tonalities.positive_surprise - tonalities.negative_surprise,
      anticipation:
        tonalities.optimistic_anticipation -
        tonalities.pessimistic_anticipation,
    }));
}
