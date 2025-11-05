import React from 'react';

import { useLayerOrderZoomStore } from './store';

import LayerOrderZoom from './index';

import WindowLayout from '@/components/shared/WindowLayout';

const LayerOrderZoomWindow: React.FC = () => {
  const closeLayerOrderZoomWindow = useLayerOrderZoomStore(
    (state) => state.closeLayerOrderZoomWindow
  );

  const handleClose = () => {
    void closeLayerOrderZoomWindow();
  };

  return (
    <WindowLayout onClose={handleClose} containerClassName="zoom-effects-window-container">
      <LayerOrderZoom />
    </WindowLayout>
  );
};

export default LayerOrderZoomWindow;
