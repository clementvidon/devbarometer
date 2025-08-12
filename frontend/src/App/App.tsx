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
          className={styles.navButton}
          href="https://github.com/clementvidon/devbarometer"
          aria-label="Infos page"
          target="_blank"
          rel="noopener noreferrer"
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
          aria-label="Author's GitHub"
          target="_blank"
          rel="noopener noreferrer"
        >
          {' Clément Vidon '}
        </a>
        · MIT License
      </footer>
    </>
  );
}

export default App;
