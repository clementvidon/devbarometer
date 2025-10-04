import { type HeadlineDto, HeadlineDtoSchema } from '@devbarometer/shared';
import { useEffect, useState } from 'react';
import { shuffleArray } from '../../utils/shuffle';

export function useTickerData() {
  const [headlines, setHeadlines] = useState<HeadlineDto[] | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const baseUrl = import.meta.env.BASE_URL ?? '/';
        const res = await fetch(baseUrl + 'ticker.json');
        if (!res.ok) {
          setHeadlines([]);
          return;
        }
        const payload: unknown = await res.json();
        const result = HeadlineDtoSchema.array().safeParse(payload);
        if (!result.success) {
          setError(new Error(result.error.message));
          setHeadlines([]);
          return;
        }
        setHeadlines(shuffleArray(result.data));
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Erreur inconnue'));
        setHeadlines([]);
      }
    })();
  }, []);

  return {
    headlines,
    isLoading: headlines === null && error === null,
    error,
  };
}
