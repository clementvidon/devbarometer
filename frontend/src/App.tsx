import './App.css';
import { ReportViewer } from './components/ReportViewer.tsx';

function App() {
  return (
    <div className="app">
      <header className="app-header">Devbarometer</header>
      <main className="components-container">
        <ReportViewer />
      </main>
    </div>
  );
}

export default App;
