import { useEffect, useMemo, useState } from 'react';
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

const THEME = {
  axisText: '#9ec3ff',
  axisLine: '#6b93c9',
  grid: '#2a4566',
  tooltipBg: 'rgba(18, 34, 52, 0.96)',
  tooltipBorder: '#3a5f8f',
  tooltipText: '#dbeaff',
};

const LABELS_FR: Record<string, string> = {
  joy: 'Joie',
  trust: 'Confiance',
  positive: 'Positivité',
  negative: 'Négativité',

  fear: 'Peur',
  anger: 'Colère',
  disgust: 'Dégoût',
  sadness: 'Tristesse',
};

const COLOR_MAP = {
  joy: '#00FFFF',
  trust: '#00CFFF',
  positive: '#66FF99',
  negative: '#FF0066',

  fear: '#FF6600',
  anger: '#FF3300',
  disgust: '#FFCC66',
  sadness: '#FF9999',
} as const;

const KEYS = Object.keys(COLOR_MAP) as Array<keyof typeof COLOR_MAP>;
type Key = (typeof KEYS)[number];

const formatChartDate = (value: string) =>
  new Date(value).toLocaleDateString('fr-FR', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  });

const formatChartValue = (value: number) => value.toFixed(2);

type RawEntry = {
  createdAt: string;
  emotions: Record<string, number>;
};

type Point = {
  date: string;
  createdAt: string;
} & Record<Key, number>;

export function Chart() {
  const [baseData, setBaseData] = useState<Point[] | null>(null);
  const [view, setView] = useState<'delta' | 'cumulative'>('delta');
  const [hudVisible, setHudVisible] = useState(false);
  const [tooltipActive, setTooltipActive] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('chart.json');
        const raw = (await res.json()) as RawEntry[];

        const parsed = raw
          .slice()
          .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
          .map((item) => ({
            date: new Date(item.createdAt).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            }),
            createdAt: item.createdAt,
            ...Object.fromEntries(
              KEYS.map((k) => [k, +(item.emotions[k] ?? 0).toFixed(3)]),
            ),
          })) as Point[];

        setBaseData(parsed);
      } catch (e) {
        console.error('Erreur lors du chargement des données:', e);
      }
    })();
  }, []);

  const cumulativeData = useMemo(() => {
    if (!baseData) return null;
    const totals = Object.fromEntries(KEYS.map((k) => [k, 0])) as Record<
      Key,
      number
    >;
    return baseData.map((p) => {
      const out = { ...p };
      for (const k of KEYS) {
        totals[k] += p[k];
        out[k] = +totals[k].toFixed(3);
      }
      return out;
    });
  }, [baseData]);

  if (!baseData) return <p>Loading chart…</p>;
  const data = view === 'delta' ? baseData : cumulativeData!;
  const diffDays = baseData.length;

  return (
    <div className={styles.chartContainer}>
      <div
        className={styles.chart}
        title="Cliquer pour basculer delta/cumul"
        onMouseDown={() => setTooltipActive(true)}
        onMouseUp={() => setTooltipActive(false)}
        onTouchStart={() => setTooltipActive(true)}
        onTouchEnd={() => setTooltipActive(false)}
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
              tickFormatter={formatChartDate}
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
              labelFormatter={formatChartDate}
              formatter={(value: number, name: string) => [
                formatChartValue(value),
                LABELS_FR[name] ?? name,
              ]}
            />

            {KEYS.map((key) => (
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

      <p className={styles.heading}>
        <span
          onClick={() => setView(view === 'delta' ? 'cumulative' : 'delta')}
          role="button"
        >
          <button
            type="button"
            className={styles.toggle}
            onClick={(e) => {
              e.stopPropagation();
              setHudVisible((v) => !v);
            }}
            title={
              hudVisible
                ? 'Masquer axes et valeurs'
                : 'Afficher axes et valeurs'
            }
          >
            ⚙️
          </button>
          {view === 'delta'
            ? `Évolution quotidienne des émotions sur les ${diffDays}\u00A0derniers jours.`
            : `Cumul émotionnel des ${diffDays}\u00A0derniers jours.`}
        </span>
      </p>

      <div className={styles.legend}>
        <div className={styles.column}>
          {KEYS.slice(0, Math.ceil(KEYS.length / 2)).map((key) => (
            <LegendItem
              key={key}
              color={COLOR_MAP[key]}
              label={LABELS_FR[key]}
            />
          ))}
        </div>
        <div className={styles.column}>
          {KEYS.slice(Math.ceil(KEYS.length / 2)).map((key) => (
            <LegendItem
              key={key}
              color={COLOR_MAP[key]}
              label={LABELS_FR[key]}
              right
            />
          ))}
        </div>
      </div>
    </div>
  );
}

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
