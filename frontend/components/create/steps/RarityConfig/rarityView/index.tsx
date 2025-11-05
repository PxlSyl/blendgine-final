import React, { useEffect, useMemo } from 'react';

import { useLayerOrder } from '@/components/store/layerOrder/hook';
import { useRarity } from '@/components/store/rarityStore/hook';

import RaritySetSelector from './ViewSelector';
import RarityVisualization from './RarityVizualization';
import RarityConsole from './RarityConsole';

const RarityOverview: React.FC = () => {
  const { rarityConfig, sets, activeSetId } = useLayerOrder();
  const currentSetId = activeSetId ?? 'set1';
  const {
    selectedLayer,
    setSelectedLayer,
    isGlobalViewActive,
    lastActiveSet,
    refreshGlobalRarityData,
    setGlobalViewActive,
  } = useRarity();

  useEffect(() => {
    if (!isGlobalViewActive && lastActiveSet && lastActiveSet !== currentSetId) {
      setGlobalViewActive(false);
    }
  }, [isGlobalViewActive, lastActiveSet, currentSetId, setGlobalViewActive]);

  useEffect(() => {
    if (isGlobalViewActive) {
      void refreshGlobalRarityData();
    }
  }, [isGlobalViewActive, refreshGlobalRarityData]);

  useEffect(() => {
    if (selectedLayer && isGlobalViewActive) {
      void refreshGlobalRarityData();
    }
  }, [selectedLayer, isGlobalViewActive, refreshGlobalRarityData]);

  const availableLayers = useMemo(
    () =>
      Object.keys(rarityConfig).filter((layer) => {
        const layerConfig = rarityConfig[layer];

        if (isGlobalViewActive) {
          return Object.keys(sets).some((setId) => layerConfig?.sets?.[setId]?.active);
        }

        if (!layerConfig?.sets?.[currentSetId]?.active) {
          return false;
        }

        return (
          Object.values(layerConfig?.traits ?? {}).some((trait) =>
            Object.keys(trait.sets ?? {}).some((setId) => trait.sets[setId]?.enabled)
          ) ||
          (layerConfig?.sets && Object.values(layerConfig.sets).some((set) => set.active))
        );
      }),
    [rarityConfig, currentSetId, sets, isGlobalViewActive]
  );

  React.useEffect(() => {
    if (!selectedLayer && availableLayers.length > 0) {
      setSelectedLayer(availableLayers[0]);
    } else if (selectedLayer && !availableLayers.includes(selectedLayer)) {
      setSelectedLayer(availableLayers.length > 0 ? availableLayers[0] : null);
    }
  }, [availableLayers, selectedLayer, setSelectedLayer]);

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex flex-col lg:flex-row h-auto lg:h-[600px] space-y-3 lg:space-y-0">
          <div className="w-full lg:flex-1 lg:mr-2 h-[600px]">
            {selectedLayer ? (
              <RarityVisualization selectedLayer={selectedLayer} activeSet={currentSetId} />
            ) : (
              <div
                className={`flex items-center justify-center h-full rounded-sm bg-white text-gray-500 dark:bg-gray-800 dark:text-gray-400 shadow-lg`}
              >
                <p className="text-lg italic">Select a layer to view rarity distribution</p>
              </div>
            )}
          </div>
          <div className="w-full lg:w-64 h-64 lg:h-full">
            <RaritySetSelector
              selectedLayer={selectedLayer}
              availableLayers={availableLayers}
              onSelectLayer={setSelectedLayer}
            />
          </div>
        </div>
        {selectedLayer && <RarityConsole selectedLayer={selectedLayer} activeSet={currentSetId} />}
      </div>
    </>
  );
};

export default RarityOverview;
