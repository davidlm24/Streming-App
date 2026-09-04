import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { MediaManagerProvider } from './context/MediaManagerContext';
import { ThemeProvider } from './context/ThemeContext';

// Handle Vite HMR WebSocket errors globally so they don't break or clutter the app
window.addEventListener('unhandledrejection', (event) => {
  const msg = event?.reason?.message || String(event?.reason || '');
  if (msg.includes('WebSocket') || msg.includes('websocket') || msg.includes('socket')) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <MediaManagerProvider>
        <App />
      </MediaManagerProvider>
    </ThemeProvider>
  </StrictMode>,
);

