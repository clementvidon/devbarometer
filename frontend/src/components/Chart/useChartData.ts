import { AggregatedEmotionProfileDtoSchema } from '@devbarometer/shared';
import { useEffect, useState } from 'react';
import { EMOTION_KEYS, TONALITY_KEYS } from './config';
import { smoothUX } from './smoothing';
import {
  buildEmotionSeries,
  buildTonalitySeries,
  type EmotionSeriesPoint,
  type TonalitySeriesPoint,
} from './transformChartSeries';

export function useChartData() {
  const [emotionData, setEmotionData] = useState<EmotionSeriesPoint[] | null>(
    null,
  );
  const [tonalityData, setTonalityData] = useState<
    TonalitySeriesPoint[] | null
  >(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const baseUrl = import.meta.env.BASE_URL ?? '/';
        const res = await fetch(baseUrl + 'chart.json');
        const profiles = AggregatedEmotionProfileDtoSchema.array().parse(
          await res.json(),
        );
        setEmotionData(
          smoothUX(buildEmotionSeries(profiles), EMOTION_KEYS, 'custom'),
        );
        setTonalityData(
          smoothUX(buildTonalitySeries(profiles), TONALITY_KEYS, 'custom'),
        );
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Erreur inconnue'));
        setEmotionData([]);
        setTonalityData([]);
      }
    })();
  }, []);

  return {
    emotionData,
    tonalityData,
    isLoading: !emotionData || !tonalityData,
    error,
  };
}
