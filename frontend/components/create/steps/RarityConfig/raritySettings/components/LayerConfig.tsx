import React, { useCallback, useMemo, useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { api } from '@/services';

import type {
  LayerConfig,
  UpdateRarityAction,
  IncompatibilitiesBySets,
  ForcedCombinationsBySets,
  TraitConfig,
} from '@/types/effect';

import { useStore } from '@/components/store';
import { useRarity } from '@/components/store/rarityStore/hook';
import { useLayerOrder } from '@/components/store/layerOrder/hook';
import { useProjectSetup } from '@/components/store/projectSetup/hook';

import { Card } from './Card';
import { LayerHeader } from './LayerHeader';
import { LayerActions } from './LayerActions';
import { SkipConfig } from './SkipConfig';
import { TraitItem } from './TraitItem';

const extractIncompatibilitiesForTrait = (
  trait: string,
  incompatibilities: Record<string, Record<string, string[]>>
): Record<string, string[]> => {
  const result: Record<string, string[]> = {};

  if (!incompatibilities?.[trait]) {
    return result;
  }

  Object.entries(incompatibilities[trait]).forEach(([layer, traits]) => {
    result[layer] = traits;
  });

  return result;
};

const extractForcedCombinationsForTrait = (
  trait: string,
  forcedCombinations: Record<string, Record<string, string[]>>
): Record<string, string[]> => {
  const result: Record<string, string[]> = {};

  if (!forcedCombinations?.[trait]) {
    return result;
  }

  Object.entries(forcedCombinations[trait]).forEach(([layer, traits]) => {
    result[layer] = traits;
  });

  return result;
};

interface LayerConfigProps {
  layer: string;
  layerConfig: LayerConfig;
  updateRarity: (layer: string, trait: string, action: UpdateRarityAction) => void;
  handleSkipToggle: (layer: string) => Promise<void>;
  equalizeRarity: (layer: string) => void;
  randomizeLayer: (layer: string) => void;
  resetLayerRarity: (layer: string) => void;
  toggleLock: (layer: string, trait?: string) => void;
}

const LayerConfigUI: React.FC<LayerConfigProps> = ({
  layer,
  layerConfig,
  updateRarity,
  handleSkipToggle,
  equalizeRarity,
  randomizeLayer,
  resetLayerRarity,
  toggleLock,
}) => {
  const { darkMode } = useStore();
  const { expandedLayers, toggleLayer, initializeLayers } = useRarity();
  const { sets, activeSetId } = useLayerOrder();
  const { layerImages } = useProjectSetup();
  const currentSetId = activeSetId ?? 'set1';
  const initializedRef = useRef(false);

  const imageInfos = useMemo(() => {
    const layerData = layerImages.find((l) => l.layerName === layer);
    return layerData?.imageInfos ?? [];
  }, [layerImages, layer]);

  const [incompatibilitiesBySets, setIncompatibilitiesBySets] = useState<IncompatibilitiesBySets>(
    {}
  );
  const [forcedCombinationsBySets, setForcedCombinationsBySets] =
    useState<ForcedCombinationsBySets>({});

  const adaptTraitConfigForTraitItem = (config: TraitConfig): TraitConfig => {
    const adaptedConfig = { ...config };

    Object.keys(adaptedConfig.sets).forEach((setId) => {
      if (!adaptedConfig.sets[setId].blend) {
        adaptedConfig.sets[setId] = {
          ...adaptedConfig.sets[setId],
          blend: {
            mode: 'source-over',
            opacity: 100,
          },
        };
      }
    });

    return adaptedConfig;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const incompatibilitiesData = await api.loadIncompatibilityState();
        const forcedCombinationsData = await api.loadForcedCombinationState();

        setIncompatibilitiesBySets(incompatibilitiesData ?? {});
        setForcedCombinationsBySets(forcedCombinationsData ?? {});
      } catch (error) {
        console.error('Error loading combinations data:', error);
        setIncompatibilitiesBySets({});
        setForcedCombinationsBySets({});
      }
    };

    void loadData();

    const refreshInterval = setInterval(() => {
      void loadData();
    }, 3000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, [currentSetId]);

  useEffect(() => {
    if (!initializedRef.current) {
      initializeLayers([layer]);
      initializedRef.current = true;
    }
  }, [layer, currentSetId, initializeLayers]);

  const isExpanded = expandedLayers[currentSetId]?.[layer] ?? true;

  const getActiveSetIncompatibilities = useCallback(() => {
    return incompatibilitiesBySets[currentSetId] ?? {};
  }, [incompatibilitiesBySets, currentSetId]);

  const getActiveSetForcedCombinations = useCallback(() => {
    return forcedCombinationsBySets[currentSetId] ?? {};
  }, [forcedCombinationsBySets, currentSetId]);

  const layerUsageInfo = useMemo(() => {
    const usedInSets = Object.entries(sets)
      .filter(([setId, setInfo]) => {
        return setInfo.layers.includes(layer) && (layerConfig.sets?.[setId]?.active ?? false);
      })
      .map(([setId]) => String(setId).replace('set', 'Set '));

    return {
      text:
        usedInSets.length === 0
          ? 'Layer is not active in any set'
          : `Active in sets: ${usedInSets.join(', ')}`,
      isWarning: usedInSets.length === 0,
    };
  }, [layer, sets, layerConfig.sets]);

  const handleToggleLayer = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleLayer(layer);
    },
    [layer, toggleLayer]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, layer: string, trait: string) => {
      const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
      if (!isNaN(value)) {
        updateRarity(layer, trait, { field: 'value', value });
      }
    },
    [updateRarity]
  );

  const getMaxValue = useCallback(
    (currentValue: number) => {
      if (!layerConfig.traits) {
        return 100;
      }

      const layerTotal = Object.values(layerConfig.traits).reduce((sum: number, config) => {
        if (config.sets?.[currentSetId]?.enabled) {
          const setValue = config.sets?.[currentSetId]?.value ?? 0;
          return sum + setValue;
        }
        return sum;
      }, 0);
      return Math.min(100, 100 - (layerTotal - currentValue));
    },
    [layerConfig.traits, currentSetId]
  );

  const isLayerLocked = layerConfig.sets?.[currentSetId]?.locked ?? false;
  const traits = layerConfig.traits ?? {};
  const noneConfig = traits['None']
    ? {
        ...traits['None'],
        enabled: traits['None'].sets?.[currentSetId]?.enabled ?? false,
        value: traits['None'].sets?.[currentSetId]?.value ?? 0,
        locked: traits['None'].sets?.[currentSetId]?.locked ?? false,
        sets: traits['None'].sets ?? {},
      }
    : { enabled: false, value: 0, locked: false, sets: {} };
  const layerIncompatibilities =
    (getActiveSetIncompatibilities()[layer] as Record<string, string[]>) ?? {};
  const layerForcedCombinations =
    (getActiveSetForcedCombinations()[layer] as Record<string, string[]>) ?? {};

  return (
    <Card locked={isLayerLocked} className="mb-2" onToggleLock={() => toggleLock(layer)}>
      <LayerHeader
        layer={layer}
        isExpanded={isExpanded}
        isLayerLocked={isLayerLocked ?? false}
        layerUsageInfo={layerUsageInfo}
        handleToggleLayer={handleToggleLayer}
        toggleLock={toggleLock}
      />

      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <LayerActions
              layer={layer}
              isLayerLocked={isLayerLocked ?? false}
              equalizeRarity={equalizeRarity}
              randomizeLayer={randomizeLayer}
              resetLayerRarity={resetLayerRarity}
            />

            <div className={`${isLayerLocked ? 'opacity-80' : ''}`}>
              <ul
                className={`mb-4 ml-4 list-none pl-4 border-l-2 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}
              >
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <SkipConfig
                    layer={layer}
                    noneConfig={noneConfig}
                    isLayerLocked={isLayerLocked}
                    handleSkipToggle={handleSkipToggle}
                    handleInputChange={handleInputChange}
                    getMaxValue={getMaxValue}
                    toggleLock={toggleLock}
                  />
                </motion.div>

                {Object.entries(traits || {})
                  .filter(([traitName]) => traitName !== 'None')
                  .sort(([traitNameA], [traitNameB]) =>
                    String(traitNameA).localeCompare(String(traitNameB))
                  )
                  .map(([traitName, traitConfig]) => {
                    const config = traitConfig;
                    const isEnabled = config.sets?.[currentSetId]?.enabled ?? false;

                    if (!isEnabled) {
                      return null;
                    }

                    return (
                      <li key={traitName} className="relative mb-2">
                        <span
                          className={`absolute -left-4 top-[16px] w-4 h-0.5 bg-gray-300 dark:bg-gray-600`}
                        />
                        <TraitItem
                          layer={layer}
                          trait={traitName}
                          config={adaptTraitConfigForTraitItem(config)}
                          isLayerLocked={isLayerLocked}
                          handleInputChange={handleInputChange}
                          getMaxValue={getMaxValue}
                          toggleLock={toggleLock}
                          traitIncompatibilities={extractIncompatibilitiesForTrait(traitName, {
                            [layer]: layerIncompatibilities,
                          })}
                          traitForcedCombinations={extractForcedCombinationsForTrait(traitName, {
                            [layer]: layerForcedCombinations,
                          })}
                          imageInfos={imageInfos}
                        />
                      </li>
                    );
                  })}
              </ul>

              <div className="mt-2 mr-8 text-sm font-bold flex justify-end">
                <span>
                  Total:{' '}
                  <span
                    className={`${
                      Object.entries(traits).reduce((sum: number, [, config]) => {
                        if (config.sets[currentSetId]?.enabled) {
                          const setValue = config.sets[currentSetId]?.value ?? 0;
                          return sum + setValue;
                        }
                        return sum;
                      }, 0) > 100
                        ? 'text-[rgb(var(--color-quaternary))]'
                        : 'text-[rgb(var(--color-secondary))]'
                    }`}
                  >
                    {Object.entries(traits)
                      .reduce((sum: number, [, config]) => {
                        if (config.sets[currentSetId]?.enabled) {
                          const setValue = config.sets[currentSetId]?.value ?? 0;
                          return sum + setValue;
                        }
                        return sum;
                      }, 0)
                      .toFixed(2)}
                    %
                  </span>
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default LayerConfigUI;
