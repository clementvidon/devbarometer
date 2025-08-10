import styles from './Chart.module.css';
import {
  EMOTION_COLORS,
  EMOTION_KEYS,
  EMOTION_LABELS,
  TONALITY_COLORS,
  TONALITY_KEYS,
  TONALITY_LABELS,
} from './config.ts';

type Mode = 'emotions' | 'tonalities';

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className={styles.legendItem}>
      <span className={styles.colorDot} style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
}

export function ChartLegend({ mode = 'emotions' }: { mode?: Mode }) {
  const items =
    mode === 'emotions'
      ? EMOTION_KEYS.map((k) => ({
          key: String(k),
          color: EMOTION_COLORS[k],
          label: EMOTION_LABELS[k],
        }))
      : TONALITY_KEYS.map((k) => ({
          key: String(k),
          color: TONALITY_COLORS[k],
          label: TONALITY_LABELS[k],
        }));

  return (
    <div className={`${styles.legend} ${styles.gridOne}`}>
      <div className={styles.column}>
        {items.map((it) => (
          <LegendItem key={it.key} color={it.color} label={it.label} />
        ))}
      </div>
    </div>
  );
}
