import './styles/base.css';
import './styles/fonts.css';
import './styles/layout.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App/App';

let rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
