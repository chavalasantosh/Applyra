import React from 'react';
import { createRoot } from 'react-dom/client';
import './lab.css';
import { LabApp } from './App.tsx';

const rootEl = document.getElementById('lab-root');
if (rootEl) {
  createRoot(rootEl).render(
    <React.StrictMode>
      <LabApp />
    </React.StrictMode>
  );
}
