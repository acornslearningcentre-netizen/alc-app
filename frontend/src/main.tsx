import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/base.css';
import './styles/variants.css';
import './styles/v2/tokens.css';
import './styles/v2/base.css';
import './styles/v2/v1-bridge.css';
import './components/review/review-guide.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
