import React, { useState, useCallback, useEffect } from 'react';

import { listen } from '@tauri-apps/api/event';

import { api } from '@/services';

import type { RarityConfig } from '@/types/effect';

import { useRulesStore } from './store/main';
import { useIncompatibilities } from './hooks/useIncompatibilities';
import { useForcedCombinations } from './hooks/useForcedCombinations';
import { useInitialData } from './hooks/useInitialData';
import { useFilteredCombinations } from './hooks/useFilteredCombinations';

import { SetSelector } from '@/components/shared/sets/SetSelector';
import { CombinationItem } from '@/components/windows/rules/components/common/CombinationItem';
import CombinationNav from '@/components/windows/rules/components/common/CombinationNav';
import IncompatibilitySelector from '@/components/windows/rules/components/Incompatibilities';
import ForcedCombinationSelector from '@/components/windows/rules/components/ForcedCombinations';

interface LayerCombinationsProps {
  localRarityConfig?: RarityConfig;
  activeSet?: string;
  availableSets?: number[];
  customSetNames?: Record<string, string>;
  projectFolder?: string;
}

const LayerCombinations: React.FC<LayerCombinationsProps> = ({
  localRarityConfig = {},
  activeSet = 'set1',
  availableSets = [1],
  customSetNames = {},
  projectFolder = '',
}) => {
  const [currentActiveSet, setCurrentActiveSet] = useState(activeSet);
  const { activeMode, setActiveMode } = useRulesStore();
  const { dataError, forceRefresh } = useInitialData(currentActiveSet);

  const {
    incompatibilitySelectors,
    getActiveSetIncompatibilities,
    addIncompatibility,
    updateIncompatibilitySelector,
    setIncompatibilitiesActiveSet,
    removeIncompatibility,
    resetIfInvalid,
    cleanupIncompatibilities,
  } = useIncompatibilities();

  const {
    forcedCombinationSelectors,
    getActiveSetForcedCombinations,
    addForcedCombination,
    updateForcedCombinationSelector,
    setForcedCombinationActiveSet,
    removeForcedCombination,
    resetIfInvalid: resetForcedCombinationInvalid,
    cleanupForcedCombinations,
  } = useForcedCombinations();

  const handleSetActiveMode = useCallback(
    async (mode: 'incompatibilities' | 'forced') => {
      try {
        await setActiveMode(mode);
      } catch (error) {
        console.error('Error setting active mode:', error);
      }
    },
    [setActiveMode]
  );

  const handleSetChange = useCallback(
    async (setNumber: number) => {
      try {
        const newActiveSet = `set${setNumber}`;
        setCurrentActiveSet(newActiveSet);
        await setIncompatibilitiesActiveSet(setNumber);
        await setForcedCombinationActiveSet(newActiveSet);
        forceRefresh();
      } catch (error) {
        console.error('Error changing set:', error);
      }
    },
    [setIncompatibilitiesActiveSet, setForcedCombinationActiveSet, forceRefresh]
  );

  const incompatibilities = getActiveSetIncompatibilities();
  const forcedCombinations = getActiveSetForcedCombinations();

  const {
    filteredIncompatibilities,
    filteredForcedCombinations,
    countIncompatibilities,
    countForcedCombinations,
  } = useFilteredCombinations(incompatibilities, forcedCombinations);

  const orderedLayers = Object.keys(localRarityConfig).filter(
    (layer) => localRarityConfig[layer]?.sets?.[currentActiveSet]?.active === true
  );

  const handleIncompatibilityAdded = useCallback(() => {
    setTimeout(() => {
      getActiveSetIncompatibilities();
      forceRefresh();
    }, 100);
  }, [forceRefresh, getActiveSetIncompatibilities]);

  const handleForcedCombinationAdded = useCallback(() => {
    setTimeout(() => {
      getActiveSetForcedCombinations();
      forceRefresh();
    }, 100);
  }, [forceRefresh, getActiveSetForcedCombinations]);

  const handleRemoveIncompatibility = useCallback(
    (item1: string, category1: string, item2: string, category2: string) => {
      void removeIncompatibility(item1, category1, item2, category2);
      setTimeout(() => {
        getActiveSetIncompatibilities();
        forceRefresh();
      }, 100);
    },
    [removeIncompatibility, getActiveSetIncompatibilities, forceRefresh]
  );

  const handleRemoveForcedCombination = useCallback(
    (category1: string, item1: string, category2: string, item2: string) => {
      void removeForcedCombination(item1, category1, item2, category2);
      setTimeout(() => {
        getActiveSetForcedCombinations();
        forceRefresh();
      }, 100);
    },
    [removeForcedCombination, getActiveSetForcedCombinations, forceRefresh]
  );

  useEffect(() => {
    const initTheme = async () => {
      try {
        const darkMode = await api.getTheme();
        document.documentElement.classList.toggle('dark', darkMode);
      } catch (error) {
        console.error('Error getting theme:', error);
      }
    };
    void initTheme();

    let cancelled = false;

    const unlistenPromise = listen('rules-theme-init', (event: { payload: boolean }) => {
      if (!cancelled) {
        const isDark = event.payload;
        document.documentElement.classList.toggle('dark', isDark);
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
          // Silent fail for race conditions
        });
    };
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 bg-white dark:bg-gray-800 rounded-sm shadow-lg border border-gray-200 dark:border-gray-700 mb-2">
        <div className="flex items-center mb-2">
          <SetSelector
            useHook={false}
            activeSet={currentActiveSet}
            availableSets={availableSets}
            onSetClick={(setNumber) => void handleSetChange(setNumber)}
            allowRename={false}
            allowDelete={false}
            allowDuplicate={false}
            showAddButton={false}
            customNames={customSetNames}
            tooltipsDisabled={true}
            containerClassName="flex-1"
            allowDrag={false}
          />
        </div>
        <CombinationNav
          activeMode={activeMode}
          setActiveMode={(mode) => void handleSetActiveMode(mode)}
        />
      </div>

      {dataError && (
        <div
          className="p-4 mb-4 text-sm rounded-sm"
          style={{
            color: `rgb(var(--color-quaternary))`,
            backgroundColor: `rgb(var(--color-quaternary) / 0.1)`,
            border: `1px solid rgb(var(--color-quaternary) / 0.2)`,
          }}
        >
          {dataError}
        </div>
      )}

      <div className="overflow-y-auto flex-1 space-y-4">
        {activeMode === 'incompatibilities' && (
          <>
            {incompatibilitySelectors.map((selector) => (
              <IncompatibilitySelector
                key={selector.id}
                selector={selector}
                rarityConfig={localRarityConfig}
                orderedLayers={orderedLayers}
                activeSet={currentActiveSet}
                forcedCombinations={forcedCombinations}
                updateIncompatibilitySelector={updateIncompatibilitySelector}
                addIncompatibility={addIncompatibility}
                resetIfInvalid={resetIfInvalid}
                cleanupIncompatibilities={cleanupIncompatibilities}
                onAddIncompatibility={handleIncompatibilityAdded}
              />
            ))}
            <div className="py-1">
              <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Existing Incompatibilities{' '}
                {countIncompatibilities(filteredIncompatibilities) > 0
                  ? `(${countIncompatibilities(filteredIncompatibilities)})`
                  : ''}
              </h3>
              <div className="space-y-2">
                {Object.entries(filteredIncompatibilities || {}).length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No incompatibilities defined
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(filteredIncompatibilities).map(([category1, items]) =>
                      Object.entries(items ?? {}).map(([item1, categories]) =>
                        Object.entries(categories ?? {}).flatMap(
                          ([category2, incompatibleItems]) => {
                            if (!incompatibleItems) {
                              return [];
                            }

                            const itemArray = Array.isArray(incompatibleItems)
                              ? incompatibleItems
                              : [];

                            return itemArray.map((item2) => (
                              <CombinationItem
                                key={`${category1}-${item1}-${category2}-${item2}`}
                                layer1={category1}
                                trait1={item1}
                                layer2={category2}
                                trait2={String(item2)}
                                onRemove={() =>
                                  handleRemoveIncompatibility(item1, category1, item2, category2)
                                }
                                type="incompatible"
                                projectFolder={projectFolder}
                              />
                            ));
                          }
                        )
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeMode === 'forced' && (
          <>
            {forcedCombinationSelectors.map((selector) => (
              <ForcedCombinationSelector
                key={selector.id}
                selector={selector}
                rarityConfig={localRarityConfig}
                orderedLayers={orderedLayers}
                activeSet={currentActiveSet}
                incompatibilitiesData={incompatibilities}
                updateForcedCombinationSelector={(id, updates) =>
                  void updateForcedCombinationSelector(id, updates)
                }
                addForcedCombination={addForcedCombination}
                resetIfInvalid={resetForcedCombinationInvalid}
                cleanupForcedCombinations={cleanupForcedCombinations}
                onAddForcedCombination={handleForcedCombinationAdded}
              />
            ))}
            <div className="py-1">
              <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Existing Forced Combinations{' '}
                {countForcedCombinations(filteredForcedCombinations) > 0
                  ? `(${countForcedCombinations(filteredForcedCombinations)})`
                  : ''}
              </h3>
              <div className="space-y-2">
                {Object.entries(filteredForcedCombinations || {}).length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No forced combinations defined
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(filteredForcedCombinations).map(([category1, items]) =>
                      Object.entries(items ?? {}).map(([item1, categories]) =>
                        Object.entries(categories ?? {}).flatMap(([category2, forcedItems]) => {
                          if (!forcedItems) {
                            return [];
                          }

                          const itemArray = Array.isArray(forcedItems) ? forcedItems : [];

                          return itemArray.map((item2) => (
                            <CombinationItem
                              key={`${category1}-${item1}-${category2}-${item2}`}
                              layer1={category1}
                              trait1={item1}
                              layer2={category2}
                              trait2={String(item2)}
                              onRemove={() =>
                                handleRemoveForcedCombination(category1, item1, category2, item2)
                              }
                              type="forced"
                              projectFolder={projectFolder}
                            />
                          ));
                        })
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LayerCombinations;
