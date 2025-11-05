import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './layersview.css';
import LayersviewWindow from './components/windows/layersview/LayersviewWindow';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <LayersviewWindow />
    </React.StrictMode>
  );
}
