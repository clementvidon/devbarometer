import { ChartCanvas } from './ChartCanvas';
import { TONALITY_COLORS, TONALITY_KEYS, TONALITY_LABELS } from './config';
import type { TonalityPoint } from './parsers';

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
