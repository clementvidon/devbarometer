import { useEffect, useState } from 'react';
import type { SentimentReport } from '../../types/SentimentReport';
import styles from './Report.module.css';

export function Report() {
  const [report, setReport] = useState<SentimentReport | null>(null);

  useEffect(() => {
    const baseUrl: string = import.meta.env.BASE_URL ?? '/';
    void fetch(baseUrl + 'report.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: unknown) => {
        if (data && typeof data === 'object') {
          setReport(data as SentimentReport);
        } else {
          setReport(null);
        }
      });
  }, []);

  if (!report) return <p>Loading…</p>;

  return (
    <div className={styles.report}>
      <div className={styles.emoji}>{report.emoji}</div>
      <p className={styles.text}>{report.text}</p>
    </div>
  );
}
