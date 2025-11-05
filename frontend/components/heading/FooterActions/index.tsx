import React, { useMemo, useCallback } from 'react';

import { useProjectSetup } from '@/components/store/projectSetup/hook';
import { useRarity } from '@/components/store/rarityStore/hook';
import { useFilters } from '@/components/store/filters/hook';

import { useStore } from '@/components/store';
import { useGenerateStore } from '@/components/store/generate';
import { useLayerOrder } from '@/components/store/layerOrder/hook';
import { useLegendaryNFTStore } from '@/components/store/legendary';
import { useIsProcessing } from '@/components/hooks/useIsProcessing';

import { GenerateButton } from './GenerateButton';

const FooterActions = React.memo(() => {
  const step = useStore((state) => state.step);
  const activeSection = useStore((state) => state.activeSection);
  const showExtraButtons = useStore((state) => state.showExtraButtons);
  const { equalizeAllLayers, randomizeAllLayers, resetAll } = useRarity();
  const { randomizePercentages, equalizePercentages, resetPercentages } = useFilters();
  const { saveRarityConfig } = useLayerOrder();
  const { exportFolder } = useProjectSetup();

  const handleMixLegendaries = useCallback(async () => {
    try {
      const generateStore = useGenerateStore.getState();
      const legendaryStore = useLegendaryNFTStore.getState();

      await generateStore.handleMixLegendaryNFTs(legendaryStore.legendaryFolder, exportFolder);
      generateStore.setIsMixComplete(true);
    } catch (error) {
      console.error('Error mixing legendaries:', error);
    }
  }, [exportFolder]);

  const handleRandomizeAll = useCallback(() => {
    try {
      const mainStore = useStore.getState();

      if (mainStore.step === 3) {
        void randomizeAllLayers();
        void saveRarityConfig();
      } else if (mainStore.step === 5) {
        randomizePercentages();
      }
    } catch (error) {
      console.error('Error randomizing all:', error);
    }
  }, [randomizeAllLayers, randomizePercentages, saveRarityConfig]);

  const handleEqualizeAll = useCallback(() => {
    try {
      const mainStore = useStore.getState();

      if (mainStore.step === 3) {
        void equalizeAllLayers();
        void saveRarityConfig();
      } else if (mainStore.step === 5) {
        equalizePercentages();
      }
    } catch (error) {
      console.error('Error equalizing all:', error);
    }
  }, [equalizeAllLayers, equalizePercentages, saveRarityConfig]);

  const handleResetAll = useCallback(() => {
    try {
      const mainStore = useStore.getState();

      if (mainStore.step === 3) {
        resetAll();
        void saveRarityConfig();
      } else if (mainStore.step === 5) {
        resetPercentages();
      }
    } catch (error) {
      console.error('Error resetting all:', error);
    }
  }, [resetAll, resetPercentages, saveRarityConfig]);

  const stepConfig = useMemo(() => {
    switch (step) {
      case 1:
        return {
          title: 'Project Setup',
          showGenerateButton: false,
          showExtraButtons: false,
          isGenerationStep: false,
          isFilterStep: false,
          isLegendaryStep: false,
        };
      case 2:
        return {
          title: 'Layer Order',
          showGenerateButton: false,
          showExtraButtons: false,
          isGenerationStep: false,
          isFilterStep: false,
          isLegendaryStep: false,
        };
      case 3:
        return {
          title: 'Rarity Configuration',
          showGenerateButton: false,
          showExtraButtons,
          isGenerationStep: false,
          isFilterStep: false,
          isLegendaryStep: false,
        };
      case 4:
        return {
          title: 'Generation',
          showGenerateButton: true,
          showExtraButtons: false,
          isGenerationStep: true,
          isFilterStep: false,
          isLegendaryStep: false,
        };
      case 5:
        return {
          title: 'Effects Setup',
          showGenerateButton: true,
          showExtraButtons: true,
          isGenerationStep: false,
          isFilterStep: true,
          isLegendaryStep: false,
        };
      case 6:
        return {
          title: 'Legendary NFT Mixer',
          showGenerateButton: true,
          showExtraButtons: false,
          isGenerationStep: false,
          isFilterStep: false,
          isLegendaryStep: true,
        };
      default:
        return {
          title: '',
          showGenerateButton: false,
          showExtraButtons: false,
          isGenerationStep: false,
          isFilterStep: false,
          isLegendaryStep: false,
        };
    }
  }, [step, showExtraButtons]);

  const handlers = useMemo(
    () => ({
      handleGenerate: async (): Promise<void> => {
        try {
          const generateStore = useGenerateStore.getState();
          await generateStore.handleGenerate();
        } catch (error) {
          console.error('Error generating:', error);
        }
      },
      handleApplyFilters: async (): Promise<void> => {
        try {
          const generateStore = useGenerateStore.getState();
          await generateStore.handleApplyFilters();
        } catch (error) {
          console.error('Error applying filters:', error);
        }
      },
      onMixLegendaries: handleMixLegendaries,
    }),
    [handleMixLegendaries]
  );

  const getButtonType = useCallback((): 'filter' | 'generation' | 'legendary' | undefined => {
    if (stepConfig.isFilterStep) {
      return 'filter';
    }
    if (stepConfig.isGenerationStep) {
      return 'generation';
    }
    if (stepConfig.isLegendaryStep) {
      return 'legendary';
    }
    return undefined;
  }, [stepConfig.isFilterStep, stepConfig.isGenerationStep, stepConfig.isLegendaryStep]);

  const isProcessing = useIsProcessing();

  if (activeSection === 'manage') {
    return null;
  }

  if (!stepConfig.showExtraButtons && !stepConfig.showGenerateButton) {
    return null;
  }

  return (
    <div className="mx-2 mt-2 flex flex-col space-y-2 p-2 rounded-sm shadow-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col space-y-1">
        {stepConfig.showExtraButtons && (
          <div className="flex justify-between space-x-1">
            <button
              onClick={handleEqualizeAll}
              disabled={false}
              className="flex-1 px-4 py-2 bg-[rgb(var(--color-primary))] text-white rounded-sm hover:bg-[rgb(var(--color-primary-dark))] cursor-pointer"
              style={{
                boxShadow:
                  'inset 0 1px 0 0 rgba(255,255,255,0.4), inset 0 -2px 2px rgba(0,0,0,0.2), inset -2px 0 2px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.2)',
                border: '1px solid rgb(var(--color-primary))',
                textShadow: '0 -1px 0 rgba(0,0,0,0.2)',
              }}
            >
              Equalize All
            </button>
            <button
              onClick={handleRandomizeAll}
              disabled={false}
              className="flex-1 px-4 py-2 bg-[rgb(var(--color-secondary))] text-white rounded-sm hover:bg-[rgb(var(--color-secondary-dark))] cursor-pointer"
              style={{
                boxShadow:
                  'inset 0 1px 0 0 rgba(255,255,255,0.4), inset 0 -2px 2px rgba(0,0,0,0.2), inset -2px 0 2px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.2)',
                border: '1px solid rgb(var(--color-secondary))',
                textShadow: '0 -1px 0 rgba(0,0,0,0.2)',
              }}
            >
              Randomize All
            </button>
            <button
              onClick={handleResetAll}
              disabled={false}
              className="flex-1 px-4 py-2 bg-[rgb(var(--color-accent))] text-white rounded-sm hover:bg-[rgb(var(--color-accent-dark))] cursor-pointer"
              style={{
                boxShadow:
                  'inset 0 1px 0 0 rgba(255,255,255,0.4), inset 0 -2px 2px rgba(0,0,0,0.2), inset -2px 0 2px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.2)',
                border: '1px solid rgb(var(--color-accent))',
                textShadow: '0 -1px 0 rgba(0,0,0,0.2)',
              }}
            >
              Reset All
            </button>
          </div>
        )}
        {stepConfig.showGenerateButton && (
          <GenerateButton
            type={getButtonType()}
            disabled={false}
            handlers={handlers}
            isProcessing={isProcessing}
          />
        )}
      </div>
    </div>
  );
});

FooterActions.displayName = 'FooterActions';

export default FooterActions;
