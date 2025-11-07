import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Effect } from 'effect';
import { listen } from '@tauri-apps/api/event';

import { useLayerOrder } from '@/components/store/layerOrder/hook';
import { useProjectSetup } from '@/components/store/projectSetup/hook';
import { useRarity } from '@/components/store/rarityStore/hook';
import { useImageSorting } from './canvas/hooks/useImagesSorting';
import type { RarityConfig, TraitConfig } from '@/types/effect';

import StepWrapper from '@/components/heading/StepWrapper';
import PreviewImage from './canvas/PreviewImage';
import PreviewConsole from './previewConsole';
import { ActionButtons } from './layers/ActionButtons';
import LayersOptions from './layers/LayersOptions';
import LayerList from './layers/LayerList';
import { SetSelector } from '@/components/shared/sets/SetSelector';

const LayerOrder: React.FC = () => {
  const {
    sets,
    activeSetId,
    possibleCombinations,
    enableAllLayers,
    disableAllLayers,
    expandAllLayers,
    collapseAllLayers,
    rarityConfig,
    moveLayer,
    calculatePossibleCombinations,
    forcedTraits,
    removeForcedTrait,
    saveRarityConfig,
    saveState,
    setActiveSet,
    initializeSetOrders,
    triggerGeneration,
    viewMode,
    isGenerating,
    cameraType,
    images,
    updateImagesOrder,
    updateRarityConfig,
  } = useLayerOrder();

  const { selectedFolder, validateAndReloadLayers } = useProjectSetup();
  const [isVisible, setIsVisible] = useState(false);
  const { getRarityConfig, clearForcedCombinationsCache } = useRarity();
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  const sortedImages = useImageSorting({
    images,
    isGenerating,
    sets,
    currentSetId: activeSetId ?? 'set1',
    rarityConfig,
  });

  const currentSet = useMemo(() => {
    const currentSetId = activeSetId ?? 'set1';
    return sets[currentSetId];
  }, [sets, activeSetId]);

  const currentLayers = useMemo(() => {
    return currentSet?.layers ?? [];
  }, [currentSet]);

  const triggerGenerationRef = useRef(triggerGeneration);
  triggerGenerationRef.current = triggerGeneration;

  useEffect(() => {
    const initializeEffect = Effect.gen(function* (_) {
      if (selectedFolder) {
        try {
          const currentSetId = activeSetId ?? 'set1';

          clearForcedCombinationsCache();

          if (!initializeSetOrders || initializeSetOrders.length === 0) {
            initializeSetOrders();
          }

          if (currentSet && currentLayers.length === 0) {
            yield* _(
              Effect.tryPromise({
                try: () => validateAndReloadLayers(selectedFolder),
                catch: (error) => {
                  console.error('Error validating and reloading layers:', error);
                  return Promise.resolve();
                },
              })
            );
          }

          if (currentLayers.length > 0) {
            setIsVisible(true);
            void calculatePossibleCombinations(currentSetId);
            void getRarityConfig();
          }
        } catch (error) {
          console.error('Error in initialization effect:', error);
        }
      }
    });

    void Effect.runPromise(initializeEffect);
  }, [
    selectedFolder,
    activeSetId,
    currentSet,
    currentLayers,
    initializeSetOrders,
    validateAndReloadLayers,
    calculatePossibleCombinations,
    getRarityConfig,
    clearForcedCombinationsCache,
  ]);

  // Listen for offset changes from offset window
  useEffect(() => {
    let cancelled = false;

    const unlistenPromise = listen<{
      layer: string;
      trait: string;
      offsetX: number;
      offsetY: number;
    }>('offset-changed', (event) => {
      if (!cancelled && rarityConfig) {
        const { layer, trait, offsetX, offsetY } = event.payload;
        const currentSetId = activeSetId ?? 'set1';

        updateRarityConfig((config: RarityConfig) => {
          const newConfig: RarityConfig = JSON.parse(JSON.stringify(config)) as RarityConfig;

          const layerConfig = newConfig[layer];
          if (!layerConfig?.traits) {
            return config;
          }

          const traitConfig: TraitConfig | undefined = layerConfig.traits[trait];
          if (!traitConfig?.sets?.[currentSetId]) {
            return config;
          }

          traitConfig.sets[currentSetId].offsetX = offsetX;
          traitConfig.sets[currentSetId].offsetY = offsetY;

          return newConfig;
        });

        void saveRarityConfig();
      }
    });

    return () => {
      cancelled = true;
      unlistenPromise
        .then((unlistenFn) => {
          if (!cancelled && typeof unlistenFn === 'function') {
            unlistenFn();
          }
        })
        .catch(() => {
          // Silent fail
        });
    };
  }, [rarityConfig, activeSetId, updateRarityConfig, saveRarityConfig]);

  const handleSetChange = (setNumber: number) => {
    setActiveSet(setNumber);
    forceUpdate();
  };

  const handleDisableAllLayers = () => {
    const disableEffect = Effect.gen(function* (_) {
      disableAllLayers();
      yield* _(
        Effect.tryPromise({
          try: () => Promise.all([saveRarityConfig(), saveState()]),
          catch: (error) => {
            console.error('Error saving state after disabling layers:', error);
            return Promise.resolve();
          },
        })
      );
      if (!isGenerating) {
        void triggerGeneration();
      }
    });

    void Effect.runPromise(disableEffect);
  };

  const handleEnableAllLayers = () => {
    const enableEffect = Effect.gen(function* (_) {
      enableAllLayers();
      yield* _(
        Effect.tryPromise({
          try: () => Promise.all([saveRarityConfig(), saveState()]),
          catch: (error) => {
            console.error('Error saving state after enabling layers:', error);
            return Promise.resolve();
          },
        })
      );
      if (!isGenerating) {
        void triggerGeneration();
      }
    });

    void Effect.runPromise(enableEffect);
  };

  const handleExpandAllLayers = () => {
    const expandEffect = Effect.gen(function* (_) {
      expandAllLayers();
      yield* _(
        Effect.tryPromise({
          try: () => saveState(),
          catch: (error) => {
            console.error('Error saving state after expanding layers:', error);
            return Promise.resolve();
          },
        })
      );
    });

    void Effect.runPromise(expandEffect);
  };

  const handleCollapseAllLayers = () => {
    const collapseEffect = Effect.gen(function* (_) {
      collapseAllLayers();
      yield* _(
        Effect.tryPromise({
          try: () => saveState(),
          catch: (error) => {
            console.error('Error saving state after collapsing layers:', error);
            return Promise.resolve();
          },
        })
      );
    });

    void Effect.runPromise(collapseEffect);
  };

  const handleResetForcedTraits = () => {
    const resetEffect = Effect.gen(function* (_) {
      const currentSetId = activeSetId ?? 'set1';
      const activeSetForcedTraits = forcedTraits[currentSetId] ?? {};
      Object.keys(activeSetForcedTraits).forEach((layer) => {
        removeForcedTrait(layer);
      });
      yield* _(
        Effect.tryPromise({
          try: () => saveState(),
          catch: (error) => {
            console.error('Error saving state after resetting forced traits:', error);
            return Promise.resolve();
          },
        })
      );
      if (!isGenerating) {
        void triggerGeneration();
      }
    });

    void Effect.runPromise(resetEffect);
  };

  const handleLayerMove = (fromIndex: number, toIndex: number) => {
    moveLayer(fromIndex, toIndex);
    updateImagesOrder(currentLayers);
  };

  const currentSetId = activeSetId ?? 'set1';

  return (
    <StepWrapper headerTitle="Layers and previews">
      <div className="flex flex-col h-full">
        <div className="flex-none mb-2">
          <SetSelector
            useHook={true}
            allowRename={true}
            allowDelete={true}
            allowDuplicate={true}
            showAddButton={true}
            onSetClick={handleSetChange}
          />
        </div>

        <div className="grow flex flex-col lg:flex-row gap-x-2">
          <div className="w-full lg:w-1/2 overflow-hidden">
            {isVisible && selectedFolder && (
              <div className="h-full">
                <PreviewImage />
              </div>
            )}
          </div>

          <div className="mt-2 lg:mt-0 w-full lg:w-1/2 flex flex-col h-[calc(100vh-180px)] min-h-[600px]">
            <div className="flex-none">
              <div
                className={`p-2 rounded-sm shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-purple-100 dark:border-gray-700/50`}
              >
                <LayersOptions possibleCombinations={possibleCombinations} />
              </div>
              <div
                className={`px-2 py-1 rounded-sm mt-2 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-purple-100 dark:border-gray-700/50`}
              >
                <ActionButtons
                  isVisible={isVisible}
                  onExpandAll={handleExpandAllLayers}
                  onCollapseAll={handleCollapseAllLayers}
                  onEnableAll={handleEnableAllLayers}
                  onDisableAll={handleDisableAllLayers}
                  onResetForcedTraits={handleResetForcedTraits}
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto min-h-[250px] relative">
              <div className="absolute inset-0">
                <LayerList
                  key={`layer-list-${currentSetId}`}
                  activeSet={currentSetId}
                  orderedLayersSets={sets}
                  onLayerMove={handleLayerMove}
                />
              </div>
            </div>

            <div className="flex-none mt-2">
              <PreviewConsole
                isGenerating={isGenerating}
                sortedImages={sortedImages}
                viewMode={viewMode}
                rarityConfig={rarityConfig}
                activeSet={currentSetId}
                orderedLayersSets={sets}
                layers={currentLayers}
                cameraType={cameraType}
              />
            </div>
          </div>
        </div>
      </div>
    </StepWrapper>
  );
};

export default LayerOrder;
