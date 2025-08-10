import { useEffect, useState } from 'react';
import { assertRawEntries } from '../../types/Chart.ts';
import styles from './Chart.module.css';
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
  if (!emotionData || !tonalityData) return <p>Loading chart…</p>;

  const toggle = () =>
    setView((v) => (v === 'emotions' ? 'tonalities' : 'emotions'));

  return (
    <div className={styles.chartContainer}>
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

      <p className={styles.heading}>
        {view === 'emotions'
          ? `Émotions des ${diffDays}\u00A0 derniers jours.`
          : `Tonalités des ${diffDays}\u00A0 derniers jours.`}
      </p>

      <div className={styles.bottomRow}>
        <div>
          <ChartLegend mode={view} />
        </div>

        <div className={styles.controls}>
          <button
            type="button"
            className={styles.controlButton}
            onClick={toggle}
          >
            {view === 'emotions' ? 'Voir tonalités 📈' : 'Voir émotions 📊'}
          </button>

          <button
            type="button"
            className={styles.controlButton}
            aria-pressed={hudVisible}
            onClick={() => setHudVisible((v) => !v)}
            title={
              hudVisible ? 'Masquer axes/valeurs' : 'Afficher axes/valeurs'
            }
          >
            {hudVisible
              ? 'Masquer axes/valeurs ⚙️'
              : 'Afficher axes/valeurs ⚙️'}
          </button>

          <button
            type="button"
            className={styles.controlButton}
            disabled
            title="Rapport bimensuel — bientôt disponible"
          >
            Rapport bimensuel 📦
          </button>
        </div>
      </div>
    </div>
  );
}
