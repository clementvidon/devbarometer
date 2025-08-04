import { HeadlineTicker } from '../components/HeadlineTicker/HeadlineTicker.tsx';
import { HistoryChart } from '../components/HistoryChart/HistoryChart.tsx';
import { ReportViewer } from '../components/ReportViewer/ReportViewer.tsx';
import styles from './App.module.css';

function App() {
  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.heading}>DevBarometer</h1>
        <a
          href="about.html"
          className={styles.navButton}
          aria-label="About page"
        >
          about
        </a>
      </header>

      <main className={styles.mainContent}>
        <ReportViewer />
        <HeadlineTicker />
        <HistoryChart />
      </main>

      <footer className={styles.footer}>
        Made with ❤️ by
        <a
          href="https://github.com/clementvidon/"
          aria-label="Clément Vidon GitHub"
        >
          {' Clément Vidon '}
        </a>
        · MIT License
      </footer>
    </>
  );
}

export default App;
