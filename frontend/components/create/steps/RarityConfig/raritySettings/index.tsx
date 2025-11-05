import React from 'react';
import { motion } from 'framer-motion';

import type { UpdateRarityAction, LayerConfig as LayerConfigType } from '@/types/effect';

import { useRarity } from '@/components/store/rarityStore/hook';
import { useLayerOrder } from '@/components/store/layerOrder/hook';

import LayerConfig from './components/LayerConfig';

interface RaritySettingsProps {
  activeLayers: string[];
  handleUpdateRarity: (layer: string, trait: string, action: UpdateRarityAction) => void;
  handleSkipToggleWrapper: (layer: string) => Promise<void>;
  equalizeRarity: (layer: string) => void;
  randomizeLayer: (layer: string) => void;
  resetLayerRarity: (layer: string) => void;
}

const RaritySettings: React.FC<RaritySettingsProps> = ({
  activeLayers,
  handleUpdateRarity,
  handleSkipToggleWrapper,
  equalizeRarity,
  randomizeLayer,
  resetLayerRarity,
}) => {
  const { toggleLock } = useRarity();
  const { rarityConfig } = useLayerOrder();

  const getLayerConfig = (layer: string): LayerConfigType => {
    const config = rarityConfig[layer];
    if (!config) {
      return {
        sets: {},
        traits: {},
        locked: false,
      };
    }
    return config;
  };

  const renderLayerConfig = (layer: string) => (
    <LayerConfig
      key={layer}
      layer={layer}
      layerConfig={getLayerConfig(layer)}
      updateRarity={handleUpdateRarity}
      handleSkipToggle={handleSkipToggleWrapper}
      equalizeRarity={equalizeRarity}
      randomizeLayer={randomizeLayer}
      resetLayerRarity={resetLayerRarity}
      toggleLock={(layer, trait) => void toggleLock(layer, trait)}
    />
  );

  return (
    <div className="h-full">
      {activeLayers.length > 0 ? (
        <div className="flex flex-col lg:flex-row lg:space-x-2 h-full">
          <motion.div
            className="w-full lg:w-1/2 p-2 rounded-sm shadow-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex flex-col min-h-[300px] lg:min-h-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.3,
              delay: 0.1,
              ease: 'easeOut',
            }}
          >
            <div className="flex-1 overflow-auto relative">
              <div className="pr-2">
                <div className="block lg:hidden">{activeLayers.map(renderLayerConfig)}</div>
                <div className="hidden lg:block">
                  {activeLayers.slice(0, Math.ceil(activeLayers.length / 2)).map(renderLayerConfig)}
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div
            className="hidden lg:flex w-full lg:w-1/2 p-2 rounded-sm shadow-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex-col min-h-[300px] lg:min-h-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.3,
              delay: 0.2,
              ease: 'easeOut',
            }}
          >
            <div className="flex-1 overflow-auto relative">
              <div className="pr-2">
                {activeLayers.slice(Math.ceil(activeLayers.length / 2)).map(renderLayerConfig)}
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-lg text-gray-500 dark:text-gray-400">No layers available</p>
        </div>
      )}
    </div>
  );
};

export default RaritySettings;
