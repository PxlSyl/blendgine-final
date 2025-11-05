import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './zoom.css';
import LayerOrderZoomWindow from './components/windows/layerOrderZoom/LayerOrderZoomWindow';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <LayerOrderZoomWindow />
    </React.StrictMode>
  );
}
