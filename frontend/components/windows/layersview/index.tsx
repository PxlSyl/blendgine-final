import React from 'react';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';

import { useKeyboardShortcuts } from '@/components/hooks/useKeyboardShortcuts';

import { useLayersviewStore } from '@/components/windows/layersview/store';

const GlobalLayersviewWindow: React.FC = () => {
  const { openLayersWindow, getAllAvailableLayersAndTraits } = useLayersviewStore();

  const handleLayersviewShortcut = () => {
    void Effect.runPromise(
      pipe(
        Effect.tryPromise(() => getAllAvailableLayersAndTraits()),
        Effect.flatMap(({ layers, traitsByLayer }) => {
          if (layers.length > 0) {
            const [firstLayer] = layers;
            const firstTrait = traitsByLayer[firstLayer]?.[0];

            if (firstTrait) {
              return Effect.tryPromise(() => openLayersWindow(firstLayer, firstTrait));
            }
          }
          return Effect.succeed(undefined);
        }),
        Effect.catchAll((error) => {
          console.error('Error opening layersview window:', error);
          return Effect.succeed(undefined);
        })
      )
    );
  };

  useKeyboardShortcuts({
    'shift+i': handleLayersviewShortcut,
  });

  return null;
};

export default GlobalLayersviewWindow;
