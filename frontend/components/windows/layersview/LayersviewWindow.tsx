import React, { useEffect, useState } from 'react';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import { listen } from '@tauri-apps/api/event';

import type { LayerData } from '@/components/windows/layersview/services/types';

import LayersviewContent from '@/components/windows/layersview/LayersviewContent';
import WindowLayout from '@/components/shared/WindowLayout';
import { useLayersviewStore } from '@/components/windows/layersview/store';

interface LayerViewEvent {
  payload: {
    layerName: string;
    traitName: string;
    imageName?: string;
    layerData?: LayerData;
  };
}

const LayersviewWindow: React.FC = () => {
  const [layerData, setLayerData] = useState<LayerData | null>(null);
  const { closeWindow } = useLayersviewStore();

  useEffect(() => {
    let cancelled = false;

    const unlistenPromise1 = listen('layersview-data-changed', (event: LayerViewEvent) => {
      if (!cancelled && event.payload.layerData) {
        setLayerData(event.payload.layerData);
      }
    });

    const unlistenPromise2 = listen('color-theme-changed', (event: { payload: string }) => {
      if (!cancelled) {
        document.documentElement.setAttribute('data-theme', event.payload);
      }
    });

    return () => {
      cancelled = true;
      Promise.all([unlistenPromise1, unlistenPromise2])
        .then(([unlistenFn1, unlistenFn2]) => {
          if (!cancelled) {
            if (typeof unlistenFn1 === 'function') {
              unlistenFn1();
            }
            if (typeof unlistenFn2 === 'function') {
              unlistenFn2();
            }
          }
        })
        .catch(() => {
          // Silent fail for race conditions
        });
    };
  }, []);

  const handleCloseWindow = () => {
    void Effect.runPromise(
      pipe(
        Effect.tryPromise(() => closeWindow()),
        Effect.catchAll((error) => {
          console.error('Error closing window:', error);
          return Effect.succeed(undefined);
        })
      )
    );
  };

  return (
    <WindowLayout onClose={handleCloseWindow} containerClassName="layersview-window-container">
      <div className="p-4 h-full">
        <LayersviewContent layerData={layerData} />
      </div>
    </WindowLayout>
  );
};

export default LayersviewWindow;
