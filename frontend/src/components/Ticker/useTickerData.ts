import { useEffect, useState } from 'react';
import { isHeadline, type HeadlineInfo } from '../../types/HeadlineInfo.ts';
import { shuffleArray } from '../../utils/shuffle.ts';

export function useTickerData() {
  const [headlines, setHeadlines] = useState<HeadlineInfo[] | null>(null);

  useEffect(() => {
    const baseUrl = import.meta.env.BASE_URL ?? '/';
    void fetch(baseUrl + 'ticker.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) => {
        if (Array.isArray(data) && data.every(isHeadline)) {
          setHeadlines(shuffleArray(data));
        } else {
          setHeadlines([]);
        }
      })
      .catch(() => setHeadlines([]));
  }, []);

  return {
    headlines,
    isLoading: headlines === null,
  };
}
