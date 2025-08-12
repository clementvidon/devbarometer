import { useEffect, useState } from 'react';
import { isHeadline, type HeadlineInfo } from '../../types/HeadlineInfo.ts';
import { shuffleArray } from '../../utils/shuffle.ts';

export function useTickerData() {
  const [headlines, setHeadlines] = useState<HeadlineInfo[] | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const baseUrl = import.meta.env.BASE_URL ?? '/';
    void fetch(baseUrl + 'ticker.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) => {
        if (Array.isArray(data) && data.every(isHeadline)) {
          setHeadlines(shuffleArray(data));
        } else {
          throw new Error('Format de données invalide');
        }
      })
      .catch((e) => {
        setError(e instanceof Error ? e : new Error('Erreur inconnue'));
        setHeadlines([]);
      });
  }, []);

  return {
    headlines,
    isLoading: headlines === null && error === null,
    error,
  };
}
