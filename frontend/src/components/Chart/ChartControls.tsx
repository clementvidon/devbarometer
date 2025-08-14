import styles from './Chart.module.css';

type View = 'emotions' | 'tonalities';

type Props = {
  view: View;
  onToggleView: () => void;
  hudVisible: boolean;
  onToggleHud: () => void;
};

export function ChartControls({
  view,
  onToggleView,
  hudVisible,
  onToggleHud,
}: Props) {
  return (
    <div className={styles.controlCol}>
      <button
        type="button"
        className={styles.controlItem}
        onClick={onToggleView}
      >
        {view === 'emotions' ? 'Voir tonalités 📈' : 'Voir émotions 📊'}
      </button>

      <button
        type="button"
        className={styles.controlItem}
        aria-pressed={hudVisible}
        onClick={onToggleHud}
        title={hudVisible ? 'Masquer axes/valeurs' : 'Afficher axes/valeurs'}
      >
        {hudVisible ? 'Masquer axes/valeurs ⚙️' : 'Afficher axes/valeurs ⚙️'}
      </button>

      <button
        type="button"
        className={styles.controlItem}
        disabled
        title="Rapport périodique — bientôt disponible"
      >
        S'abonner au rapport 📦
      </button>

      <button
        type="button"
        className={styles.controlItem}
        disabled
        title="Analyste interactif — bientôt disponible"
      >
        Parler à l'analyste 💬
      </button>
    </div>
  );
}
