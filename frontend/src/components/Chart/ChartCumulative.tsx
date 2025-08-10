import { ChartCanvas } from './ChartCanvas.tsx';
import type { Point } from './transform.ts';

type Props = {
  data: Point[];
  hudVisible: boolean;
  tooltipActive: boolean;
  setTooltipActive: (v: boolean) => void;
};

export function ChartCumulative(props: Props) {
  return <ChartCanvas {...props} />;
}
