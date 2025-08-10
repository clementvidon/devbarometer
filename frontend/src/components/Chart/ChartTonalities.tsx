import { ChartCanvas } from './ChartCanvas.tsx';
import { TONALITY_COLORS, TONALITY_KEYS, TONALITY_LABELS } from './config.ts';
import type { TonalityPoint } from './transform.ts';

type Props = {
  data: TonalityPoint[];
  hudVisible: boolean;
  tooltipActive: boolean;
  setTooltipActive: (v: boolean) => void;
};

export function ChartTonalities(props: Props) {
  const series = TONALITY_KEYS.map((k) => ({
    key: k,
    color: TONALITY_COLORS[k],
    label: TONALITY_LABELS[k],
  }));

  return <ChartCanvas {...props} series={series} />;
}
