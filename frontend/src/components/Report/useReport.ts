import { useEffect, useState } from 'react';
import type { SentimentReport } from '../../types/SentimentReport';

export function useReport() {
  const [report, setReport] = useState<SentimentReport | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const baseUrl: string = import.meta.env.BASE_URL ?? '/';
    void fetch(baseUrl + 'report.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: unknown) => {
        if (data && typeof data === 'object') {
          setReport(data as SentimentReport);
        } else {
          throw new Error('Format de données invalide');
        }
      })
      .catch((e) => {
        setError(e instanceof Error ? e : new Error('Erreur inconnue'));
        setReport(null);
      });
  }, []);

  return {
    report,
    isLoading: report === null && error === null,
    error,
  };
}
