import { useEffect, useState } from 'react';
import { assertRawEntries } from '../../types/Chart.ts';
import {
  parseEmotions,
  parseTonalities,
  type EmotionPoint,
  type TonalityPoint,
} from './parsers.ts';

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
        const raw: unknown = await res.json();
        assertRawEntries(raw);
        setEmotionData(parseEmotions(raw));
        setTonalityData(parseTonalities(raw));
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
