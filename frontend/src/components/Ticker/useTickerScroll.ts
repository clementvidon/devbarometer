import React, { useCallback, useRef } from 'react';
import styles from './Ticker.module.css';

type UseTickerScrollOptions = {
  copies: number;
  onPause: () => void;
  onResume: () => void;
  pauseDelay?: number;
};

export function useTickerScroll(
  trackRef: React.RefObject<HTMLDivElement | null>,
  rowRef: React.RefObject<HTMLDivElement | null>,
  { copies, onPause, onResume, pauseDelay = 120 }: UseTickerScrollOptions,
) {
  const DRAG_THRESHOLD = 10;
  const EDGE_PADDING = 24;
  const INERTIA_FIX_DELTA = 0.01;

  const isDown = useRef(false);
  const hasDragged = useRef(false);
  const dragJustHappened = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);
  const pauseTimer = useRef<number | null>(null);

  const recenterIfNeeded = () => {
    const track = trackRef.current;
    const row = rowRef.current;
    if (!track || !row) return;

    const total = row.scrollWidth;
    const single = total / copies;

    if (track.scrollLeft < EDGE_PADDING) {
      track.scrollLeft += single;
    } else if (track.scrollLeft > single * 2 - EDGE_PADDING) {
      track.scrollLeft -= single;
    }
  };

  const cancelScrollInertia = (el: HTMLElement) => {
    el.scrollLeft += INERTIA_FIX_DELTA;
    el.scrollLeft -= INERTIA_FIX_DELTA;
  };

  const placeInitialScroll = useCallback(() => {
    const track = trackRef.current;
    const row = rowRef.current;
    if (!track || !row) return;

    const id = requestAnimationFrame(() => {
      track.scrollLeft = row.scrollWidth / copies;
    });

    return () => cancelAnimationFrame(id);
  }, [copies]);

  const clearPauseTimer = () => {
    if (pauseTimer.current !== null) {
      window.clearTimeout(pauseTimer.current);
      pauseTimer.current = null;
    }
  };

  const onPointerDown = useCallback<React.PointerEventHandler<HTMLDivElement>>(
    (e) => {
      const track = trackRef.current;
      if (!track) return;

      isDown.current = true;
      hasDragged.current = false;
      dragJustHappened.current = false;

      startX.current = e.clientX;
      startScrollLeft.current = track.scrollLeft;
      track.classList.add(styles.dragging);

      clearPauseTimer();
      pauseTimer.current = window.setTimeout(() => {
        if (isDown.current && !hasDragged.current) onPause();
      }, pauseDelay);

      const onUp = () => {
        isDown.current = false;
        track.classList.remove(styles.dragging);

        clearPauseTimer();
        recenterIfNeeded();
        cancelScrollInertia(track);
        onResume();

        window.removeEventListener('pointerup', onUp);
      };

      window.addEventListener('pointerup', onUp);
    },
    [trackRef, onPause, onResume, pauseDelay],
  );

  const onPointerMove = useCallback<React.PointerEventHandler<HTMLDivElement>>(
    (e) => {
      const track = trackRef.current;
      if (!track || !isDown.current) return;

      const dx = e.clientX - startX.current;

      if (!hasDragged.current && Math.abs(dx) > DRAG_THRESHOLD) {
        hasDragged.current = true;
        dragJustHappened.current = true;
        clearPauseTimer();
        onPause(); // pause immédiate dès qu’on entre en drag
      }

      if (hasDragged.current) {
        track.scrollLeft = startScrollLeft.current - dx;
        recenterIfNeeded();
        e.preventDefault();
      }
    },
    [trackRef, onPause],
  );

  const onClickCapture = useCallback<React.MouseEventHandler<HTMLDivElement>>(
    (e) => {
      if (dragJustHappened.current) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [],
  );

  return {
    onPointerDown,
    onPointerMove,
    onClickCapture,
    placeInitialScroll,
  };
}
