import { ChartCanvas } from './ChartCanvas';
import { EMOTION_COLORS, EMOTION_KEYS, EMOTION_LABELS } from './config';
import type { EmotionSeriesPoint } from './transformChartSeries';

type Props = {
  data: EmotionSeriesPoint[];
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
