import { useEffect, useState } from 'react';
import styles from './HeadlineTicker.module.css';

export function HeadlineTicker() {
  const [headlines, setHeadlines] = useState<string[] | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const baseUrl: string = import.meta.env.BASE_URL ?? '/';
    void fetch(baseUrl + 'headlines.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) =>
        Array.isArray(data) ? setHeadlines(data) : setHeadlines([]),
      )
      .catch((e) => {
        console.error('Error loading headlines:', e);
        setHeadlines([]);
      });
  }, []);

  useEffect(() => {
    if (!headlines || headlines.length === 0) return;

    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % headlines.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [headlines]);

  if (headlines === null) return <p>Loading…</p>;
  if (headlines.length === 0) return <p>Aucun titre chargé.</p>;

  return (
    <div className={styles.ticker}>
      <span key={index} className={styles.item}>
        "{headlines[index]}"
      </span>
    </div>
  );
}
