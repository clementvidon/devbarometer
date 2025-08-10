import { ChartCanvas } from './ChartCanvas.tsx';
import { EMOTION_COLORS, EMOTION_KEYS, EMOTION_LABELS } from './config.ts';
import type { EmotionPoint } from './transform.ts';

type Props = {
  data: EmotionPoint[];
  hudVisible: boolean;
  tooltipActive: boolean;
  setTooltipActive: (v: boolean) => void;
};

export function ChartEmotions(props: Props) {
  const series = EMOTION_KEYS.map((k) => ({
    key: k,
    color: EMOTION_COLORS[k],
    label: EMOTION_LABELS[k],
  }));

  return <ChartCanvas {...props} series={series} />;
}
