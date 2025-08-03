import { useEffect, useState } from 'react';
import { isHeadline, type HeadlineInfo } from '../../types/HeadlineInfo.ts';
import { amberToFlame } from '../../utils/colors.ts';
import { shuffleArray } from '../../utils/shuffle.ts';
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
          ? setHeadlines(shuffleArray(data))
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

  const { title, upvotes, url } = headlines[index];

  const minUpvotes = Math.min(...headlines.map((h) => h.upvotes));
  const maxUpvotes = Math.max(...headlines.map((h) => h.upvotes));
  const color = amberToFlame(upvotes, minUpvotes, maxUpvotes);

  return (
    <div className={styles.ticker}>
      <a
        className={styles.item}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
      >
        🠊 <span style={{ color }}>{title}</span>
      </a>
    </div>
  );
}
