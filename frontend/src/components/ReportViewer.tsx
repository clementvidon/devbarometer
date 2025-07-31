import { useEffect, useState } from 'react';
import type { SentimentReport } from '../types/SentimentReport';

export function ReportViewer() {
  const [report, setReport] = useState<SentimentReport | null>(null);

  useEffect(() => {
    void fetch('report.json')
      .then((r) => r.json())
      .then(setReport);
  }, []);

  if (!report) return <p>Loading…</p>;

  return (
    <div>
      <h2>{report.emoji}</h2>
      <p>{report.text}</p>
    </div>
  );
}
