import { Chart } from '../components/Chart/Chart.tsx';
import { Report } from '../components/Report/Report.tsx';
import { Ticker } from '../components/Ticker/Ticker.tsx';
import styles from './App.module.css';

function App() {
  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.heading}>DevBarometer</h1>
        <a
          href="https://github.com/clementvidon/devbarometer"
          className={styles.navButton}
          aria-label="Infos page"
        >
          à propos
        </a>
      </header>

      <main className={styles.mainContent}>
        <Report />
        <Ticker />
        <Chart />
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
