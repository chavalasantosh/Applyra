import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../web-src/visual-engine.css';
import './app.css';
import { ApplyraV3App } from './App.tsx';

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <React.StrictMode>
      <ApplyraV3App />
    </React.StrictMode>
  );
}
