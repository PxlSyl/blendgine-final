import React, { useEffect, useMemo } from 'react';

import type { UpdateRarityAction } from '@/types/effect';

import { useStore } from '@/components/store';
import { useRarity } from '@/components/store/rarityStore/hook';
import { useLayerOrder } from '@/components/store/layerOrder/hook';

import StepWrapper from '@/components/heading/StepWrapper';
import RaritySettings from './raritySettings';
import RarityOverview from './rarityView';
import RarityNav from './components/RarityNav';
import { SetSelector } from '@/components/shared/sets/SetSelector';
import { RarityActionButtons } from './raritySettings/components/RarityActionsButtons';

const RarityConfig: React.FC = () => {
  const {
    viewMode,
    setViewMode,
    updateRarity,
    equalizeRarity,
    randomizeLayer,
    handleSkipToggle,
    resetLayerRarity,
    isGlobalViewActive,
    toggleGlobalView,
    updateGlobalRarityFromConfig,
  } = useRarity();
  const { rarityConfig, loadRarityConfig, saveRarityConfig, activeSetId, setActiveSet } =
    useLayerOrder();
  const currentSetId = activeSetId ?? 'set1';
  const setShowExtraButtons = useStore((state) => state.setShowExtraButtons);

  useEffect(() => {
    void loadRarityConfig();
  }, [loadRarityConfig]);

  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  const activeLayers = useMemo(() => {
    if (!rarityConfig) {
      return [];
    }

    return Object.keys(rarityConfig)
      .filter((layer) => {
        return rarityConfig[layer]?.sets?.[currentSetId]?.active;
      })
      .map((layer) => String(layer));
  }, [rarityConfig, currentSetId]);

  const handleUpdateRarity = (layer: string, trait: string, action: UpdateRarityAction) => {
    void updateRarity(layer, trait, action);
    void saveRarityConfig();
    forceUpdate();

    if (isGlobalViewActive) {
      void updateGlobalRarityFromConfig();
    }
  };

  const handleSkipToggleWrapper = async (layer: string) => {
    await handleSkipToggle(layer);
    void saveRarityConfig();
    forceUpdate();

    if (isGlobalViewActive) {
      void updateGlobalRarityFromConfig();
    }
  };

  useEffect(() => {
    const showButtons = viewMode === 'settings';
    setShowExtraButtons(showButtons);
  }, [viewMode, setShowExtraButtons]);

  const handleSetChange = (setNumber: number) => {
    if (isGlobalViewActive) {
      toggleGlobalView();
    }
    setActiveSet(setNumber);
    forceUpdate();

    if (isGlobalViewActive) {
      void updateGlobalRarityFromConfig();
    }
  };

  return (
    <StepWrapper headerTitle="Rarity Configuration">
      <div className="flex flex-col h-[calc(100vh-8rem)] min-h-[500px] space-y-1">
        <div className="shrink-0 space-y-1">
          <div className="p-2 bg-white dark:bg-gray-800 rounded-sm shadow-lg border border-gray-200 dark:border-gray-700">
            <SetSelector
              useHook={true}
              onSetClick={handleSetChange}
              allowRename={true}
              allowDelete={true}
              allowDuplicate={true}
              showAddButton={false}
              containerClassName=""
              showGlobalButton={viewMode !== 'settings'}
              isGlobalActive={isGlobalViewActive}
              onGlobalClick={toggleGlobalView}
            />
            <RarityNav viewMode={viewMode} setViewMode={setViewMode} />
          </div>
          {viewMode === 'settings' && (
            <div className="p-2 bg-white dark:bg-gray-800 rounded-sm shadow-lg border border-gray-200 dark:border-gray-700">
              <RarityActionButtons isVisible={true} />
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0">
          {viewMode === 'settings' ? (
            <RaritySettings
              activeLayers={activeLayers}
              handleUpdateRarity={handleUpdateRarity}
              handleSkipToggleWrapper={handleSkipToggleWrapper}
              equalizeRarity={(layer) => {
                void equalizeRarity(layer);
                void saveRarityConfig();
                if (isGlobalViewActive) {
                  void updateGlobalRarityFromConfig();
                }
              }}
              randomizeLayer={(layer) => {
                void randomizeLayer(layer);
                void saveRarityConfig();
                if (isGlobalViewActive) {
                  void updateGlobalRarityFromConfig();
                }
              }}
              resetLayerRarity={(layer) => {
                resetLayerRarity(layer);
                void saveRarityConfig();
                if (isGlobalViewActive) {
                  void updateGlobalRarityFromConfig();
                }
              }}
            />
          ) : (
            <RarityOverview />
          )}
        </div>
      </div>
    </StepWrapper>
  );
};

export default RarityConfig;
