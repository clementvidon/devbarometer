import { useEffect, useState } from 'react';
import {
  assertRawEntries,
  type AggregatedEmotionProfileDto,
} from '../../types/Chart.ts';
import { EMOTION_KEYS, TONALITY_KEYS } from './config.ts';
import {
  parseEmotions,
  parseTonalities,
  type EmotionPoint,
  type TonalityPoint,
} from './parsers.ts';
import { smoothUX } from './smoothing.ts';

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
        const agg = (await res.json()) as AggregatedEmotionProfileDto[];
        const raw = agg.map((p) => ({
          createdAt: p.createdAt,
          emotions: p.emotions,
          tonalities: p.tonalities,
        }));
        assertRawEntries(raw);
        const emotions = parseEmotions(raw);
        const tonalities = parseTonalities(raw);
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
