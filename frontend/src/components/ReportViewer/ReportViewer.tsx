import { useEffect, useState } from 'react';
import type { SentimentReport } from '../../types/SentimentReport';
import styles from './ReportViewer.module.css';

export function ReportViewer() {
  const [report, setReport] = useState<SentimentReport | null>(null);

  useEffect(() => {
    void fetch('report.json')
      .then((r) => r.json())
      .then(setReport);
  }, []);

  if (!report) return <p>Loading…</p>;

  return (
    <div className={styles.report}>
      <div className={styles.emoji}>{report.emoji}</div>
      <p className={styles.paragraph}>{report.text}</p>
    </div>
  );
}
