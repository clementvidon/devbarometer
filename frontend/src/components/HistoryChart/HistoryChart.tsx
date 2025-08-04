import { useEffect, useState } from 'react';
import { Line, LineChart, ResponsiveContainer } from 'recharts';
import styles from './HistoryChart.module.css';

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

export function HistoryChart() {
  const [data, setData] = useState<Point[] | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res: Response = await fetch('average-sentiments.json');
        const raw = (await res.json()) as RawEntry[];

        const parsed: Point[] = raw.map((item) => ({
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

        setData(parsed);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      }
    })();
  }, []);

  if (!data) return <p>Loading chart…</p>;
  if (data.length === 0) return <p>No sentiment history available.</p>;

  const diffDays = data.length;

  return (
    <div className={styles.chartContainer}>
      <p className={styles.heading}>
        Tendance cumulative des émotions du marché sur {diffDays} jours :
      </p>
      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
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

      <div className={styles.legend}>
        <div className={styles.column}>
          <LegendItem color="#66FF99" label="Positif" />
          <LegendItem color="#00FFFF" label="Joie" />
          <LegendItem color="#00CFFF" label="Confiance" />
          <LegendItem color="#4781FF" label="Anticipation" />
          <LegendItem color="#99CCFF" label="Surprise" />
        </div>
        <div className={styles.column}>
          <LegendItem color="#FF0066" label="Négatif" />
          <LegendItem color="#FF3300" label="Colère" />
          <LegendItem color="#FF6600" label="Peur" />
          <LegendItem color="#FF9999" label="Tristesse" />
          <LegendItem color="#FFCC66" label="Dégoût" />
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className={styles.legendItem}>
      <span className={styles.colorDot} style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
}
