import styles from './Report.module.css';
import { useReport } from './useReport';

export function Report() {
  const { report, isLoading, error } = useReport();

  if (isLoading) {
    return (
      <p role="status" aria-live="polite">
        Chargement du rapport…
      </p>
    );
  }

  if (error || !report) {
    return (
      <p role="alert" aria-live="assertive">
        Erreur de chargement du rapport.
      </p>
    );
  }

  return (
    <div className={styles.report}>
      <div className={styles.emoji}>{report.emoji}</div>
      <p className={styles.text}>{report.text}</p>
    </div>
  );
}
