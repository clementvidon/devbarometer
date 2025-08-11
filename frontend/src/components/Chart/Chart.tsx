import { useEffect, useState } from 'react';
import { assertRawEntries } from '../../types/Chart.ts';
import styles from './Chart.module.css';
import { ChartControls } from './ChartControls.tsx';
import { ChartEmotions } from './ChartEmotions.tsx';
import { ChartLegend } from './ChartLegend.tsx';
import { ChartTonalities } from './ChartTonalities.tsx';
import {
  parseEmotions,
  parseTonalities,
  type EmotionPoint,
  type TonalityPoint,
} from './transform.ts';

type View = 'emotions' | 'tonalities';

export function Chart() {
  const [emotionData, setEmotionData] = useState<EmotionPoint[] | null>(null);
  const [tonalityData, setTonalityData] = useState<TonalityPoint[] | null>(
    null,
  );
  const [view, setView] = useState<View>('emotions');
  const [hudVisible, setHudVisible] = useState(false);
  const [tooltipActive, setTooltipActive] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('chart.json');
        const rawJson: unknown = await res.json();
        assertRawEntries(rawJson);
        const raw = rawJson;
        setEmotionData(parseEmotions(raw));
        setTonalityData(parseTonalities(raw));
      } catch (e) {
        console.error('Erreur lors du chargement des données:', e);
        setEmotionData([]);
        setTonalityData([]);
      }
    })();
  }, []);

  const diffDays = emotionData?.length ?? 0;
  if (!emotionData || !tonalityData)
    return (
      <p role="status" aria-live="polite">
        Chargement du graphique…
      </p>
    );

  const toggle = () =>
    setView((v) => (v === 'emotions' ? 'tonalities' : 'emotions'));

  return (
    <div className={styles.chartContainer}>
      <p className={styles.heading}>
        {view === 'emotions'
          ? `Intensité des émotions — ${diffDays}\u00A0jours.`
          : `Polarité des tonalités — ${diffDays}\u00A0jours.`}
      </p>

      {view === 'emotions' ? (
        <ChartEmotions
          data={emotionData}
          hudVisible={hudVisible}
          tooltipActive={tooltipActive}
          setTooltipActive={setTooltipActive}
        />
      ) : (
        <ChartTonalities
          data={tonalityData}
          hudVisible={hudVisible}
          tooltipActive={tooltipActive}
          setTooltipActive={setTooltipActive}
        />
      )}

      <div className={styles.chartFooter}>
        <div>
          <ChartLegend mode={view} />
        </div>

        <ChartControls
          view={view}
          onToggleView={toggle}
          hudVisible={hudVisible}
          onToggleHud={() => setHudVisible((v) => !v)}
        />
      </div>
    </div>
  );
}
