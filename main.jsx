import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Service Worker (PWA for iPad & tablets)
if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    // While developing (start.bat) a service worker only causes stale code: remove it and its caches.
    navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister())).catch(() => {});
    if (window.caches) caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then((reg) => reg.update()).catch((err) => {
        console.log('Service Worker registration skipped:', err);
      });
    });
  }
}
