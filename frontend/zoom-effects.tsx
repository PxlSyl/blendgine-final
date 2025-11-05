import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './zoom.css';
import ZoomEffectsWindow from './components/windows/zoom effects/ZoomEffectsWindow';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ZoomEffectsWindow />
    </React.StrictMode>
  );
}
