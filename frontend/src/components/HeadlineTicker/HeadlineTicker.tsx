import { useEffect, useState } from 'react';
import { isHeadline, type HeadlineInfo } from '../../types/HeadlineInfo.ts';
import { shuffleArray } from '../../utils/shuffle.ts';
import styles from './HeadlineTicker.module.css';

export function HeadlineTicker() {
  const [headlines, setHeadlines] = useState<HeadlineInfo[] | null>(null);

  useEffect(() => {
    const baseUrl = import.meta.env.BASE_URL ?? '/';
    void fetch(baseUrl + 'headlines.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) => {
        if (Array.isArray(data) && data.every(isHeadline)) {
          setHeadlines(shuffleArray(data));
        } else {
          setHeadlines([]);
        }
      })
      .catch((e) => {
        console.error('Error loading headlines:', e);
        setHeadlines([]);
      });
  }, []);

  if (headlines === null) return <p>Chargement…</p>;
  if (headlines.length === 0) return <p>Aucun titre chargé.</p>;

  return (
    <div className={styles.ticker}>
      <div className={styles.track}>
        <div className={styles.row}>
          {[...headlines, ...headlines].map(({ title, url }, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.item}
            >
              "{title}"
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
