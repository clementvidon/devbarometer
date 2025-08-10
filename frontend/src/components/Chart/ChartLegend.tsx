import styles from './Chart.module.css';
import { COLOR_MAP, EMOTION_KEYS, LABELS_FR } from './config.ts';

function LegendItem({
  color,
  label,
  right = false,
}: {
  color: string;
  label: string;
  right?: boolean;
}) {
  return (
    <div className={`${styles.legendItem} ${right ? styles.right : ''}`}>
      <span className={styles.colorDot} style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
}

export function ChartLegend() {
  const half = Math.ceil(EMOTION_KEYS.length / 2);
  const left = EMOTION_KEYS.slice(0, half);
  const right = EMOTION_KEYS.slice(half);

  return (
    <div className={styles.legend}>
      <div>
        {left.map((k) => (
          <LegendItem key={k} color={COLOR_MAP[k]} label={LABELS_FR[k]} />
        ))}
      </div>
      <div>
        {right.map((k) => (
          <LegendItem key={k} color={COLOR_MAP[k]} label={LABELS_FR[k]} right />
        ))}
      </div>
    </div>
  );
}
