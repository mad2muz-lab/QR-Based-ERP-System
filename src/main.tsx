import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { offlineSyncManager } from './utils/offlineSync';

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
    <App />
  </StrictMode>
);
