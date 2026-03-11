import {
  EMOTION_SCORE_FIELDS,
  TONALITY_AXIS_KEYS,
} from '@devbarometer/shared/domain';
import { AggregatedSentimentProfileDtoSchema } from '@devbarometer/shared/dtos';
import { useEffect, useState } from 'react';
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
        const baseUrl = import.meta.env.BASE_URL;
        const res = await fetch(baseUrl + 'chart.json');
        const profiles = AggregatedSentimentProfileDtoSchema.array().parse(
          await res.json(),
        );
        setEmotionData(
          smoothUX(
            buildEmotionSeries(profiles),
            EMOTION_SCORE_FIELDS,
            'custom',
          ),
        );
        setTonalityData(
          smoothUX(buildTonalitySeries(profiles), TONALITY_AXIS_KEYS, 'custom'),
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
