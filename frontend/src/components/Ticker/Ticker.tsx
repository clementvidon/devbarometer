import React, { useEffect, useRef, useState } from 'react';
import { isHeadline, type HeadlineInfo } from '../../types/HeadlineInfo.ts';
import { shuffleArray } from '../../utils/shuffle.ts';
import styles from './Ticker.module.css';

export function Ticker() {
  const [headlines, setHeadlines] = useState<HeadlineInfo[] | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const isDownRef = useRef(false);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);

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
      .catch((e) => {
        console.error('Error loading headlines:', e);
        setHeadlines([]);
      });
  }, []);

  const onMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.button !== 0) return;
    const el = trackRef.current;
    if (!el) return;
    isDownRef.current = true;
    draggingRef.current = false;
    startXRef.current = e.clientX;
    startScrollLeftRef.current = el.scrollLeft;

    const onMove = (ev: MouseEvent) => {
      if (!isDownRef.current || !el) return;
      const dx = ev.clientX - startXRef.current;

      if (!draggingRef.current && Math.abs(dx) > 3) {
        draggingRef.current = true;
        el.classList.add(styles.dragging);
      }

      if (draggingRef.current) {
        el.scrollLeft = startScrollLeftRef.current - dx;
        ev.preventDefault();
      }
    };

    const onUp = () => {
      isDownRef.current = false;
      draggingRef.current = false;
      if (el) el.classList.remove(styles.dragging);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
    e.preventDefault();
  };

  const onClickCapture: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (draggingRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  if (headlines === null)
    return (
      <p role="status" aria-live="polite">
        Chargement des titres…
      </p>
    );

  if (headlines.length === 0)
    return (
      <p role="status" aria-live="polite">
        Aucun titre chargé.
      </p>
    );

  return (
    <div className={styles.ticker}>
      <div
        ref={trackRef}
        className={styles.track}
        onMouseDown={onMouseDown}
        onClickCapture={onClickCapture}
      >
        <div className={styles.row}>
          {[...headlines, ...headlines].map(({ title, source }, i) => (
            <a
              key={i}
              href={source}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.item}
              draggable={false}
            >
              “{title}”
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
