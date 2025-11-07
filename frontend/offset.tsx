import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import OffsetWindow from './components/windows/offset';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <OffsetWindow />
    </React.StrictMode>
  );
}

