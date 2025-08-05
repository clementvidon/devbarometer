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
import styles from './HistoryChart.module.css';

const THEME = {
  axisText: '#9ec3ff',
  axisLine: '#6b93c9',
  grid: '#2a4566',
  tooltipBg: 'rgba(18, 34, 52, 0.96)',
  tooltipBorder: '#3a5f8f',
  tooltipText: '#dbeaff',
};

type RawEntry = {
  createdAt: string;
  emotions: Record<string, number>;
};

type Point = {
  date: string;
  createdAt: string;
  positive: number;
  negative: number;
  joy: number;
  fear: number;
  anger: number;
  trust: number;
  disgust: number;
  sadness: number;
  surprise: number;
  anticipation: number;
};

const KEYS = [
  'positive',
  'negative',
  'joy',
  'fear',
  'anger',
  'trust',
  'disgust',
  'sadness',
  'surprise',
  'anticipation',
] as const;

type Key = (typeof KEYS)[number];

export function HistoryChart() {
  const [baseData, setBaseData] = useState<Point[] | null>(null);
  const [view, setView] = useState<'delta' | 'cumulative'>('delta');
  const [chromeOn, setChromeOn] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('average-sentiments.json');
        const raw = (await res.json()) as RawEntry[];

        const parsed: Point[] = raw
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
            positive: +(item.emotions.positive ?? 0).toFixed(3),
            negative: +(item.emotions.negative ?? 0).toFixed(3),
            joy: +(item.emotions.joy ?? 0).toFixed(3),
            fear: +(item.emotions.fear ?? 0).toFixed(3),
            anger: +(item.emotions.anger ?? 0).toFixed(3),
            trust: +(item.emotions.trust ?? 0).toFixed(3),
            disgust: +(item.emotions.disgust ?? 0).toFixed(3),
            sadness: +(item.emotions.sadness ?? 0).toFixed(3),
            surprise: +(item.emotions.surprise ?? 0).toFixed(3),
            anticipation: +(item.emotions.anticipation ?? 0).toFixed(3),
          }));

        setBaseData(parsed);
      } catch (e) {
        console.error('Erreur lors du chargement des données:', e);
      }
    })();
  }, []);

  const cumulativeData = useMemo(() => {
    if (!baseData) return null;
    const totals: Record<Key, number> = Object.fromEntries(
      KEYS.map((k) => [k, 0]),
    ) as Record<Key, number>;

    return baseData.map((p) => {
      const out: Point = { ...p }; // typé correctement
      for (const k of KEYS) {
        totals[k] += p[k];
        out[k] = +totals[k].toFixed(3);
      }
      return out;
    });
  }, [baseData]);

  if (!baseData) return <p>Loading chart…</p>;
  if (baseData.length === 0) return <p>No sentiment history available.</p>;

  const data = view === 'delta' ? baseData : (cumulativeData ?? baseData);
  const diffDays = baseData.length;

  const chromeTitle = chromeOn
    ? 'Masquer axes et valeurs'
    : 'Afficher axes et valeurs';

  return (
    <div className={styles.chartContainer}>
      <div
        className={styles.chart}
        title="Cliquer sur le graphique pour basculer delta/cumul"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            onClick={() =>
              setView((v) => (v === 'delta' ? 'cumulative' : 'delta'))
            }
          >
            {chromeOn && (
              <CartesianGrid
                stroke={THEME.grid}
                strokeDasharray="3 3"
                vertical={false}
              />
            )}

            <XAxis
              dataKey="date"
              hide={!chromeOn}
              tick={{ fill: THEME.axisText }}
              axisLine={{ stroke: THEME.axisLine }}
              tickLine={{ stroke: THEME.axisLine }}
            />
            <YAxis
              hide={!chromeOn}
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
            />

            <Line
              type="monotone"
              dataKey="positive"
              stroke="#66FF99"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="joy"
              stroke="#00FFFF"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="trust"
              stroke="#00CFFF"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="anticipation"
              stroke="#4781FF"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="surprise"
              stroke="#99CCFF"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="negative"
              stroke="#FF0066"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="anger"
              stroke="#FF3300"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="fear"
              stroke="#FF6600"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="sadness"
              stroke="#FF9999"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="disgust"
              stroke="#FFCC66"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className={styles.heading}>
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setChromeOn((v) => !v)}
          title={chromeTitle}
          aria-pressed={chromeOn}
          aria-label="Afficher/masquer axes et grille"
        >
          ⚙️
        </button>
        {view === 'delta'
          ? `Évolution quotidienne des émotions sur les ${diffDays}\u00A0derniers jours.`
          : `Cumul émotionnel des ${diffDays}\u00A0derniers jours.`}
      </p>

      <div className={styles.legend}>
        <div className={styles.column}>
          <LegendItem color="#66FF99" label="Positivité" />
          <LegendItem color="#00FFFF" label="Joie" />
          <LegendItem color="#00CFFF" label="Confiance" />
          <LegendItem color="#4781FF" label="Anticipation" />
          <LegendItem color="#99CCFF" label="Surprise" />
        </div>
        <div className={styles.column}>
          <LegendItem color="#FF0066" label="Négativité" right />
          <LegendItem color="#FF3300" label="Colère" right />
          <LegendItem color="#FF6600" label="Peur" right />
          <LegendItem color="#FF9999" label="Tristesse" right />
          <LegendItem color="#FFCC66" label="Dégoût" right />
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
