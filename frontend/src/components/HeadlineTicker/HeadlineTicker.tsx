import { useEffect, useState } from 'react';
import type { HeadlineInfo } from '../../types/HeadlineInfo';
import styles from './HeadlineTicker.module.css';

export function HeadlineTicker() {
  const [headlines, setHeadlines] = useState<HeadlineInfo[] | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const baseUrl: string = import.meta.env.BASE_URL ?? '/';
    void fetch(baseUrl + 'headlines.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) =>
        Array.isArray(data) && data.every(isHeadline)
          ? setHeadlines(data)
          : setHeadlines([]),
      )
      .catch((e: unknown) => {
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

  const { title, url } = headlines[index];

  return (
    <div className={styles.ticker}>
      <a
        key={index}
        className={styles.item}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {title}
      </a>
    </div>
  );
}

function isHeadline(obj: unknown): obj is HeadlineInfo {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'title' in obj &&
    'upvotes' in obj &&
    'url' in obj &&
    typeof (obj as Record<string, unknown>).title === 'string' &&
    typeof (obj as Record<string, unknown>).upvotes === 'number' &&
    typeof (obj as Record<string, unknown>).url === 'string'
  );
}
