import React from 'react';

import { useZoomEffectsStore } from '@/components/windows/zoom effects/store';

import WindowLayout from '@/components/shared/WindowLayout';
import ZoomEffects from '@/components/windows/zoom effects';

const ZoomEffectsWindow: React.FC = () => {
  const closeZoomEffectsWindow = useZoomEffectsStore((state) => state.closeZoomEffectsWindow);

  return (
    <WindowLayout
      onClose={() => void closeZoomEffectsWindow()}
      containerClassName="zoom-effects-window-container"
    >
      <ZoomEffects />
    </WindowLayout>
  );
};

export default ZoomEffectsWindow;
