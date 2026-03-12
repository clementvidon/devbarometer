import {
  TONALITY_AXIS_FIELDS,
  TONALITY_AXIS_KEYS,
  type TonalityAxisKey,
} from '@devbarometer/shared/domain';
import type { AggregatedSentimentProfileDto } from '@devbarometer/shared/dtos';

import { EMOTION_COLORS } from './config';
import { dateFmtTooltip } from './formatters';

export type EmotionSeriesPoint = {
  dateLabel: string;
  createdAt: string;
} & Record<keyof typeof EMOTION_COLORS, number>;

export function buildEmotionSeries(
  profiles: AggregatedSentimentProfileDto[],
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
} & Record<TonalityAxisKey, number>;

export function buildTonalitySeries(
  profiles: AggregatedSentimentProfileDto[],
): TonalitySeriesPoint[] {
  return profiles
    .slice()
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
    .map(({ createdAt, tonalities }) => {
      const base = {} as Record<TonalityAxisKey, number>;

      for (const key of TONALITY_AXIS_KEYS) {
        const { pos, neg } = TONALITY_AXIS_FIELDS[key];
        base[key] = tonalities[pos] - tonalities[neg];
      }

      return {
        createdAt,
        ...base,
      };
    });
}
