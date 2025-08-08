import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { type RawEntry, assertRawEntries } from '../../types/Chart.ts';
import styles from './Chart.module.css';

const THEME = {
  axisText: '#9ec3ff',
  axisLine: '#6b93c9',
  grid: '#2a4566',
  tooltipBg: 'rgba(18, 34, 52, 0.96)',
  tooltipBorder: '#3a5f8f',
  tooltipText: '#dbeaff',
} as const;

const LABELS_FR: Record<string, string> = {
  joy: 'Joie',
  trust: 'Confiance',
  fear: 'Peur',
  anger: 'Colère',
  disgust: 'Dégoût',
  sadness: 'Tristesse',
};

const COLOR_MAP = {
  joy: '#00FFFF',
  trust: '#00CFFF',
  fear: '#FF6600',
  anger: '#FF3300',
  disgust: '#FFCC66',
  sadness: '#FF9999',
} as const;

type Key = keyof typeof COLOR_MAP;

type Point = {
  dateLabel: string;
  createdAt: string;
} & Record<Key, number>;

const dateFmtAxis = new Intl.DateTimeFormat('fr-FR', {
  year: '2-digit',
  month: '2-digit',
  day: '2-digit',
});

const dateFmtTooltip = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const numFmt = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function parseRaw(raw: RawEntry[]): Point[] {
  return raw
    .slice()
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
    .map((item) => {
      const base = {} as Record<Key, number>;
      for (const k of Object.keys(COLOR_MAP) as Key[]) {
        base[k] = +(item.emotions[k] ?? 0);
      }
      return {
        dateLabel: dateFmtTooltip.format(new Date(item.createdAt)),
        createdAt: item.createdAt,
        ...base,
      };
    });
}

function toCumulative(data: Point[]): Point[] {
  const totals = Object.fromEntries(
    (Object.keys(COLOR_MAP) as Key[]).map((k) => [k, 0]),
  ) as Record<Key, number>;

  return data.map((p) => {
    const out = { ...p };
    (Object.keys(COLOR_MAP) as Key[]).forEach((k) => {
      totals[k] += p[k];
      out[k] = +totals[k].toFixed(3);
    });
    return out;
  });
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

export function Chart() {
  const [baseData, setBaseData] = useState<Point[] | null>(null);
  const [view, setView] = useState<'delta' | 'cumulative'>('delta');
  const [hudVisible, setHudVisible] = useState(false);
  const [tooltipActive, setTooltipActive] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('chart.json');
        const rawJson: unknown = await res.json();
        assertRawEntries(rawJson); // ← narrowing runtime + pour ESLint
        setBaseData(parseRaw(rawJson));
      } catch (e) {
        console.error('Erreur lors du chargement des données:', e);
      }
    })();
  }, []);

  const cumulativeData = useMemo(
    () => (baseData ? toCumulative(baseData) : null),
    [baseData],
  );

  const data = baseData
    ? view === 'delta'
      ? baseData
      : cumulativeData!
    : null;

  const diffDays = baseData?.length ?? 0;

  const handlePointerDown = useCallback(() => setTooltipActive(true), []);
  const handlePointerUp = useCallback(() => setTooltipActive(false), []);

  if (!data) return <p>Loading chart…</p>;

  const KEYS = Object.keys(COLOR_MAP) as Key[];

  return (
    <div className={styles.chartContainer}>
      <div
        className={styles.chart}
        title="Cliquer pour basculer delta/cumul"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
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
              // Ne lit plus payload[0]; juste le label (= createdAt)
              labelFormatter={(label: string | number) =>
                dateFmtTooltip.format(new Date(String(label)))
              }
              formatter={(value: number, name: string) => [
                numFmt.format(value),
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
          onClick={() =>
            setView((v) => (v === 'delta' ? 'cumulative' : 'delta'))
          }
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
            aria-pressed={hudVisible}
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
