import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './lib/i18n';
import './styles/leaflet.css';
import { initAccessibility } from './lib/accessibility';
import { performanceMonitor } from './services/performance-monitoring.service';
import { appInitializer } from './lib/app-initializer';

// Initialize app services
appInitializer
  .initialize()
  .then(() => {
    console.log('✅ All services initialized');
  })
  .catch((error) => {
    console.error('❌ Service initialization failed:', error);
  });

// Initialize accessibility features
initAccessibility();

// Initialize performance monitoring
performanceMonitor.initialize({
  sentryDsn: import.meta.env.VITE_SENTRY_DSN,
  googleAnalyticsId: import.meta.env.VITE_GA_ID,
  enableRUM: true,
  sampleRate: 0.1,
});

// Register service worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then(
      (registration) => {
        console.log('SW registered: ', registration);
      },
      (error) => {
        console.log('SW registration failed: ', error);
      }
    );
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
