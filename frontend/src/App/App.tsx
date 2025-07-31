import { ReportViewer } from '../components/ReportViewer/ReportViewer.tsx';
import styles from './App.module.css';

function App() {
  return (
    <>
      <h1 className={styles.heading}>DevBarometer</h1>

      <div className={styles.reportWrapper}>
        <ReportViewer />
      </div>

      <a href="about.html" className={styles.navButton} aria-label="About page">
        About
      </a>
      <footer className={styles.footer}>
        &copy; DevBarometer 2025. All rights reserved.
      </footer>
    </>
  );
}

export default App;
