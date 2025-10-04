import {
  AggregatedEmotionProfileDtoSchema,
  parseChartEntries,
} from '@devbarometer/shared';
import { useEffect, useState } from 'react';
import { EMOTION_KEYS, TONALITY_KEYS } from './config';
import {
  parseEmotions,
  parseTonalities,
  type EmotionPoint,
  type TonalityPoint,
} from './parsers';
import { smoothUX } from './smoothing';

export function useChartData() {
  const [emotionData, setEmotionData] = useState<EmotionPoint[] | null>(null);
  const [tonalityData, setTonalityData] = useState<TonalityPoint[] | null>(
    null,
  );
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('chart.json');
        const agg = AggregatedEmotionProfileDtoSchema.array().parse(
          await res.json(),
        );
        const chartEntries = parseChartEntries(
          agg.map(({ createdAt, emotions, tonalities }) => ({
            createdAt,
            emotions,
            tonalities,
          })),
        );
        const emotions = parseEmotions(chartEntries);
        const tonalities = parseTonalities(chartEntries);
        setEmotionData(smoothUX(emotions, EMOTION_KEYS, 'custom'));
        setTonalityData(smoothUX(tonalities, TONALITY_KEYS, 'custom'));
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
