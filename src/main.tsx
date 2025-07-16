import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { offlineSyncManager } from './utils/offlineSync';
import './utils/materialSyncFix';

// Make offlineSyncManager globally accessible for debugging
if (typeof window !== 'undefined') {
  (window as any).offlineSyncManager = offlineSyncManager;
}

// Handle Vite dynamic import errors
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Module preload error, reloading page...');
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>
);
