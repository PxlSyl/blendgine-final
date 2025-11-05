import React, { useEffect, useState, useCallback } from 'react';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import { listen } from '@tauri-apps/api/event';

import type { RarityConfig } from '@/types/effect';

import { api } from '@/services';

import { useIncompatibilitiesStore } from '@/components/windows/rules/store/incompatibilitiesStore';
import { useForcedCombinationStore } from '@/components/windows/rules/store/forcedCombinationsStore';
import { useRulesStore } from '@/components/windows/rules/store/main';

import { toPromise } from '@/utils/effect/effectPromiseUtils';
import WindowLayout from '@/components/shared/WindowLayout';
import LayerCombinations from './LayerCombinations';

const getStoredModeEffect = Effect.try({
  try: () => {
    const storedMode = localStorage.getItem('rules-initial-mode');
    return storedMode === 'incompatibilities' || storedMode === 'forced' ? storedMode : undefined;
  },
  catch: (error) => new Error(`Failed to get stored mode: ${String(error)}`),
});

const loadSetDataEffect = Effect.tryPromise({
  try: async () => {
    const layerOrderState = await api.loadLayerOrderState();
    return layerOrderState;
  },
  catch: (error) => new Error(`Failed to load set data: ${String(error)}`),
});

const loadProjectSetupEffect = Effect.tryPromise({
  try: async () => {
    const projectSetup = await api.loadProjectSetup();
    return projectSetup;
  },
  catch: (error) => new Error(`Failed to load project setup: ${String(error)}`),
});

const loadRarityConfigEffect = Effect.tryPromise({
  try: async () => {
    const rarityConfig = await api.loadRarityConfig();
    return rarityConfig;
  },
  catch: (error) => new Error(`Failed to load rarity config: ${String(error)}`),
});

const RulesWindow: React.FC = () => {
  const [initialized, setInitialized] = useState(false);
  const [rarityConfig, setRarityConfig] = useState<RarityConfig | null>(null);
  const [activeSet, setActiveSet] = useState('set1');
  const [availableSets, setAvailableSets] = useState<number[]>([1]);
  const [customSetNames, setCustomSetNames] = useState<Record<string, string>>({});
  const [projectFolder, setProjectFolder] = useState<string>('');
  const { closeRulesWindow, setActiveMode } = useRulesStore();

  const loadSetData = useCallback(async () => {
    const result = await Effect.runPromise(
      pipe(
        loadSetDataEffect,
        Effect.map((layerOrderState) => {
          const currentActiveSet = layerOrderState?.activeSetId || 'set1';
          const currentAvailableSets = layerOrderState?.sets
            ? Object.keys(layerOrderState.sets)
                .map((setId) => parseInt(setId.replace('set', '')))
                .filter((num) => !isNaN(num))
                .sort((a, b) => a - b)
            : [1];

          const customNames: Record<string, string> = {};
          if (layerOrderState?.sets) {
            Object.entries(layerOrderState.sets).forEach(([setId, setInfo]) => {
              if (setInfo.customName) {
                customNames[setId] = setInfo.customName;
              }
            });
          }

          setActiveSet(currentActiveSet);
          setAvailableSets(currentAvailableSets);
          setCustomSetNames(customNames);

          const incompatibilitiesStore = useIncompatibilitiesStore.getState();
          void incompatibilitiesStore.setActiveSet(parseInt(currentActiveSet.replace('set', '')));
          void incompatibilitiesStore.setAvailableSets(currentAvailableSets);

          const forcedCombinationStore = useForcedCombinationStore.getState();
          void forcedCombinationStore.setActiveSet(currentActiveSet);
          forcedCombinationStore.setAvailableSets(currentAvailableSets);

          return undefined;
        }),
        Effect.catchAll((error) => {
          console.error('Error loading set data:', error);
          return Effect.succeed(undefined);
        })
      )
    );
    return result;
  }, []);

  const initializeStores = useCallback(async () => {
    const incompatibilitiesStore = useIncompatibilitiesStore.getState();
    const forcedCombinationStore = useForcedCombinationStore.getState();

    await toPromise(incompatibilitiesStore.initializeData());
    await toPromise(forcedCombinationStore.initializeData());
  }, []);

  useEffect(() => {
    void Effect.runPromise(
      pipe(
        getStoredModeEffect,
        Effect.map((mode) => {
          if (mode) {
            toPromise(setActiveMode(mode)).catch((error) => {
              console.error('Error setting initial mode:', error);
            });
          }

          return undefined;
        }),
        Effect.catchAll((error) => {
          console.error('Error getting initial mode:', error);
          return Effect.succeed(undefined);
        })
      )
    );
  }, [setActiveMode]);

  useEffect(() => {
    const initTheme = async () => {
      try {
        const darkMode = await api.getTheme();
        const colorTheme = await api.getColorTheme();
        document.documentElement.classList.toggle('dark', darkMode);
        document.documentElement.setAttribute('data-theme', colorTheme);
      } catch (error) {
        console.error('Error getting theme:', error);
      }
    };
    void initTheme();

    let cancelled = false;

    const unlistenPromise1 = listen('sets-updated', () => {
      if (!cancelled) {
        void (async () => {
          try {
            await loadSetData();
            await initializeStores();
          } catch (err) {
            console.error('Error in sets-updated listener:', err);
          }
        })();
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
  }, [loadSetData, initializeStores]);

  useEffect(() => {
    const initStoresEffect = Effect.gen(function* (_) {
      const projectSetup = yield* _(loadProjectSetupEffect);
      if (projectSetup?.selectedFolder) {
        setProjectFolder(projectSetup.selectedFolder);
      } else {
        console.warn('No project folder found in project setup');
      }

      yield* _(Effect.promise(() => loadSetData()));

      const rarityConfigData = yield* _(loadRarityConfigEffect);
      if (rarityConfigData) {
        setRarityConfig(rarityConfigData);
      }

      yield* _(Effect.promise(() => initializeStores()));
      setInitialized(true);
    });

    void Effect.runPromise(
      pipe(
        initStoresEffect,
        Effect.catchAll((error) => {
          console.error('Error initializing stores:', error);
          return pipe(
            Effect.promise(() => initializeStores()),
            Effect.map(() => {
              setInitialized(true);
              return undefined;
            })
          );
        })
      )
    );
  }, [loadSetData, initializeStores]);

  const renderContent = () => {
    if (!initialized) {
      return (
        <div className="flex justify-center items-center h-full">
          <span className="text-gray-500 dark:text-gray-400">Loading...</span>
        </div>
      );
    }

    if (!rarityConfig) {
      return (
        <div className="flex justify-center items-center h-full">
          <span className="text-[rgb(var(--color-quaternary))]">
            Error: Could not load rarity configuration
          </span>
        </div>
      );
    }

    return (
      <LayerCombinations
        localRarityConfig={rarityConfig}
        activeSet={activeSet}
        availableSets={availableSets}
        customSetNames={customSetNames}
        projectFolder={projectFolder}
      />
    );
  };

  return (
    <WindowLayout
      onClose={() => void closeRulesWindow()}
      containerClassName="rules-window-container"
    >
      <div className="p-4">{renderContent()}</div>
    </WindowLayout>
  );
};

export default RulesWindow;
