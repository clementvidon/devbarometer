import React, { useEffect, useMemo, useRef, useState } from 'react';
import { isHeadline, type HeadlineInfo } from '../../types/HeadlineInfo.ts';
import { shuffleArray } from '../../utils/shuffle.ts';
import styles from './Ticker.module.css';

const COPIES = 3;
const DRAG_THRESHOLD = 10;
const ANIM_RESUME_DELAY = 5000;

export function Ticker() {
  const [headlines, setHeadlines] = useState<HeadlineInfo[] | null>(null);

  const trackRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  const isDown = useRef(false);
  const hasDragged = useRef(false);
  const dragJustHappened = useRef(false);
  const hasDraggedOnce = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const data = useMemo(
    () => (headlines ? shuffleArray(headlines) : []),
    [headlines],
  );

  const looped = useMemo(
    () =>
      data.length ? Array.from({ length: COPIES }, () => data).flat() : [],
    [data],
  );

  useEffect(() => {
    const baseUrl = import.meta.env.BASE_URL ?? '/';
    void fetch(baseUrl + 'ticker.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) => {
        if (Array.isArray(data) && data.every(isHeadline)) {
          setHeadlines(data);
        } else {
          setHeadlines([]);
        }
      })
      .catch(() => setHeadlines([]));
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    const row = rowRef.current;
    if (!track || !row) return;

    const id = requestAnimationFrame(() => {
      const copyWidth = row.scrollWidth / COPIES;
      track.scrollLeft = copyWidth;
    });

    return () => cancelAnimationFrame(id);
  }, [looped.length]);

  const recenterIfNeeded = () => {
    const track = trackRef.current;
    const row = rowRef.current;
    if (!track || !row) return;

    const total = row.scrollWidth;
    const single = total / COPIES;
    const buffer = 24;

    if (track.scrollLeft < buffer) {
      track.scrollLeft += single;
    } else if (track.scrollLeft > single * 2 - buffer) {
      track.scrollLeft -= single;
    }
  };

  const resetAnimTimeout = () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      hasDraggedOnce.current = false;
    }, ANIM_RESUME_DELAY);
  };

  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const track = trackRef.current;
    if (!track) return;

    isDown.current = true;
    hasDragged.current = false;
    dragJustHappened.current = false;

    startX.current = e.clientX;
    startScrollLeft.current = track.scrollLeft;
    track.classList.add(styles.dragging);

    const onUp = () => {
      isDown.current = false;
      hasDragged.current = false;
      track.classList.remove(styles.dragging);
      recenterIfNeeded();
      window.removeEventListener('pointerup', onUp);

      resetAnimTimeout();
    };

    window.addEventListener('pointerup', onUp);
  };

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const track = trackRef.current;
    if (!track || !isDown.current) return;

    const dx = e.clientX - startX.current;

    if (!hasDragged.current && Math.abs(dx) > DRAG_THRESHOLD) {
      hasDragged.current = true;
      dragJustHappened.current = true;
      hasDraggedOnce.current = true;
    }

    if (hasDragged.current) {
      track.scrollLeft = startScrollLeft.current - dx;
      recenterIfNeeded();
      e.preventDefault();
    }
  };

  const onClickCapture: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (dragJustHappened.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  if (headlines === null) {
    return (
      <p role="status" aria-live="polite">
        Chargement des titres…
      </p>
    );
  }

  if (headlines.length === 0) {
    return (
      <p role="status" aria-live="polite">
        Aucun titre chargé.
      </p>
    );
  }

  return (
    <div
      className={styles.ticker}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onClickCapture={onClickCapture}
    >
      <div ref={trackRef} className={styles.track}>
        <div
          ref={rowRef}
          className={`${styles.row} ${hasDraggedOnce.current ? styles.noAnim : ''}`}
        >
          {looped.map(({ title, source, weight }, i) => (
            <a
              key={i}
              href={source}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.item}
              aria-label={`Source: ${title}`}
              title={title}
              draggable={false}
            >
              «{title}» ⇧{weight}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
