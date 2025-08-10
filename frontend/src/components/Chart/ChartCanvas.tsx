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
import { THEME } from './config.ts';
import { dateFmtAxis, dateFmtTooltip, numFmt } from './formatters.ts';

type SeriesSpec = {
  key: string;
  color: string;
  label?: string;
};

type Props<T extends { createdAt: string }> = {
  data: T[];
  hudVisible: boolean;
  tooltipActive: boolean;
  setTooltipActive: (v: boolean) => void;
  series: SeriesSpec[];
};

export function ChartCanvas<T extends { createdAt: string }>({
  data,
  hudVisible,
  tooltipActive,
  setTooltipActive,
  series,
}: Props<T>) {
  return (
    <div
      className={styles.chart}
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
            domain={['dataMin', 'dataMax']}
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
              name,
            ]}
          />

          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              name={s.label ?? s.key}
              activeDot={tooltipActive ? { r: 5 } : false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
