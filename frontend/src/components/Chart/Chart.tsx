import { useState } from 'react';
import styles from './Chart.module.css';
import { ChartControls } from './ChartControls.tsx';
import { ChartEmotions } from './ChartEmotions.tsx';
import { ChartLegend } from './ChartLegend.tsx';
import { ChartTonalities } from './ChartTonalities.tsx';
import { useChartData } from './useChartData.ts';

type View = 'emotions' | 'tonalities';

export function Chart() {
  const { emotionData, tonalityData, isLoading, error } = useChartData();

  const [view, setView] = useState<View>('emotions');
  const [hudVisible, setHudVisible] = useState(false);
  const [tooltipActive, setTooltipActive] = useState(false);

  if (isLoading) {
    return (
      <p role="status" aria-live="polite">
        Chargement du graphique…
      </p>
    );
  }

  if (!emotionData || !tonalityData) {
    return (
      <p role="alert" aria-live="assertive">
        Données manquantes ou invalides.
      </p>
    );
  }

  if (error) {
    return (
      <p role="alert" aria-live="assertive">
        Erreur de chargement du graphique.
      </p>
    );
  }

  const diffDays = emotionData?.length ?? 0;

  const toggle = () =>
    setView((v) => (v === 'emotions' ? 'tonalities' : 'emotions'));

  return (
    <div className={styles.chartContainer}>
      <p className={styles.heading}>
        {view === 'emotions'
          ? `Intensité des émotions – ${diffDays}\u00A0jours`
          : `Polarité des tonalités – ${diffDays}\u00A0jours`}
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
