import { useEffect, useMemo, useState } from 'react';
import { assertRawEntries } from '../../types/Chart.ts';
import styles from './Chart.module.css';
import { ChartCumulative } from './ChartCumulative.tsx';
import { ChartDailyDelta } from './ChartDailyDelta.tsx';
import { ChartLegend } from './ChartLegend.tsx';
import { parseRaw, toCumulative, type Point } from './transform.ts';

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
        assertRawEntries(rawJson);
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

  if (!data) return <p>Loading chart…</p>;

  return (
    <div className={styles.chartContainer}>
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

      {view === 'delta' ? (
        <ChartDailyDelta
          data={data}
          hudVisible={hudVisible}
          tooltipActive={tooltipActive}
          setTooltipActive={setTooltipActive}
        />
      ) : (
        <ChartCumulative
          data={data}
          hudVisible={hudVisible}
          tooltipActive={tooltipActive}
          setTooltipActive={setTooltipActive}
        />
      )}

      <ChartLegend />
    </div>
  );
}
