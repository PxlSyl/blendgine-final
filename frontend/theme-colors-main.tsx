import React from 'react';
import ReactDOM from 'react-dom/client';
import { listen } from '@tauri-apps/api/event';

import ThemeColors from './components/windows/theme-colors';
import './index.css';
import './theme-colors.css';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <ThemeColors />
  </React.StrictMode>
);

void listen('theme-colors-theme-init', (event) => {
  const darkMode = event.payload as boolean;
  document.documentElement.classList.toggle('dark', darkMode);
});

void listen('theme-colors-color-theme-init', (event) => {
  const themeName = event.payload as string;
  document.documentElement.setAttribute('data-theme', themeName);
});
