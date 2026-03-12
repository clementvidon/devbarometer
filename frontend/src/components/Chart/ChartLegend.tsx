import {
  EMOTION_SCORE_FIELDS,
  TONALITY_AXIS_KEYS,
} from '@devbarometer/shared/domain';

import styles from './Chart.module.css';
import {
  EMOTION_COLORS,
  EMOTION_LABELS,
  TONALITY_COLORS,
  TONALITY_LABELS,
} from './config';

type Mode = 'emotions' | 'tonalities';

export function ChartLegend({ mode = 'emotions' }: { mode?: Mode }) {
  const items =
    mode === 'emotions'
      ? EMOTION_SCORE_FIELDS.map((k) => ({
          key: k,
          color: EMOTION_COLORS[k],
          label: EMOTION_LABELS[k],
        }))
      : TONALITY_AXIS_KEYS.map((k) => ({
          key: k,
          color: TONALITY_COLORS[k],
          label: TONALITY_LABELS[k],
        }));

  return (
    <div className={styles.legendCol}>
      {items.map((it) => (
        <div key={it.key} className={styles.legendItem}>
          <span
            className={styles.colorDot}
            style={{ backgroundColor: it.color }}
          />
          <span>{it.label}</span>
        </div>
      ))}
    </div>
  );
}
