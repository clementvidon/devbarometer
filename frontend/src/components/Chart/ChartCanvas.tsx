import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import styles from './Chart.module.css';
import { COLOR_MAP, EMOTION_KEYS, LABELS_FR, THEME } from './config.ts';
import { dateFmtAxis, dateFmtTooltip, numFmt } from './formatters.ts';
import type { Point } from './transform.ts';

type Props = {
  data: Point[];
  hudVisible: boolean;
  tooltipActive: boolean;
  setTooltipActive: (v: boolean) => void;
};

export function ChartCanvas({
  data,
  hudVisible,
  tooltipActive,
  setTooltipActive,
}: Props) {
  return (
    <div
      className={styles.chart}
      title="Cliquer pour basculer delta/cumul"
      onPointerDown={() => setTooltipActive(true)}
      onPointerUp={() => setTooltipActive(false)}
      onPointerCancel={() => setTooltipActive(false)}
      onPointerLeave={() => setTooltipActive(false)}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          {hudVisible && (
            <CartesianGrid
              stroke={THEME.grid}
              strokeDasharray="3 3"
              vertical={false}
            />
          )}

          <XAxis
            dataKey="createdAt"
            hide={!hudVisible}
            tick={{ fill: THEME.axisText }}
            axisLine={{ stroke: THEME.axisLine }}
            tickLine={{ stroke: THEME.axisLine }}
            tickFormatter={(v: string) => dateFmtAxis.format(new Date(v))}
          />

          <YAxis
            hide={!hudVisible}
            tick={{ fill: THEME.axisText }}
            axisLine={{ stroke: THEME.axisLine }}
            tickLine={{ stroke: THEME.axisLine }}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: THEME.tooltipBg,
              border: `1px solid ${THEME.tooltipBorder}`,
              borderRadius: 8,
            }}
            labelStyle={{ color: THEME.tooltipText }}
            itemStyle={{ color: THEME.tooltipText }}
            cursor={{ stroke: THEME.axisLine, strokeDasharray: '3 3' }}
            wrapperStyle={{ display: tooltipActive ? 'block' : 'none' }}
            labelFormatter={(label: string | number) =>
              dateFmtTooltip.format(new Date(String(label)))
            }
            formatter={(value: number, name: string) => [
              numFmt.format(value),
              LABELS_FR[name] ?? name,
            ]}
          />

          {EMOTION_KEYS.map((key) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={COLOR_MAP[key]}
              strokeWidth={2}
              dot={false}
              activeDot={tooltipActive ? { r: 5 } : false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
