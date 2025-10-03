import './styles/base.css';
import './styles/fonts.css';
import './styles/layout.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
