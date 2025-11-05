import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { TraitConfig } from '@/types/effect';

import { FileIcon } from '@/components/icons';
import Toggle from '@/components/shared/Toggle';
import LockButton from '@/components/shared/LockButton';
import SmallNumericStepper from '@/components/shared/SmallNumericStepper';
import { ThinSlider } from '@/components/shared/ThinSlider';
import { useLayerOrder } from '@/components/store/layerOrder/hook';
import { useColorStore } from '@/components/store/randomUI';
import { useStore } from '@/components/store';

interface SkipConfigProps {
  layer: string;
  noneConfig: TraitConfig;
  isLayerLocked: boolean;
  handleSkipToggle: (layer: string) => Promise<void>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>, layer: string, trait: string) => void;
  getMaxValue: (currentValue: number) => number;

  toggleLock: (layer: string, trait?: string) => void;
}

export const SkipConfig: React.FC<SkipConfigProps> = ({
  layer,
  noneConfig,
  isLayerLocked,
  handleSkipToggle,
  handleInputChange,
  getMaxValue,
  toggleLock,
}) => {
  const { activeSetId } = useLayerOrder();
  const currentSetId = activeSetId ?? 'set1';
  const { getColorForKey } = useColorStore();
  const { themeName } = useStore();
  const [skipColor, setSkipColor] = useState('#000000');

  useEffect(() => {
    const color = getColorForKey(`${layer}-None`);
    setSkipColor(color);
  }, [layer, getColorForKey, themeName]);

  const handleNumericChange = (newValue: number) => {
    const event = { target: { value: newValue.toString() } } as React.ChangeEvent<HTMLInputElement>;
    handleInputChange(event, layer, 'None');
  };

  const isSkipLocked = noneConfig.sets?.[currentSetId]?.locked ?? false;
  const isDisabled = isLayerLocked || isSkipLocked;
  const currentSetConfig = noneConfig.sets?.[currentSetId];

  const baseStyle =
    'bg-white/90 dark:bg-gray-700/90 hover:bg-gray-50/95 dark:hover:bg-gray-600/95 rounded-sm py-1 px-1 flex items-center min-h-[32px] text-sm backdrop-blur-sm border border-gray-300 dark:border-gray-600/30';

  const baseStyleSmall = baseStyle.replace('py-1', 'py-0.5');

  return (
    <div className="mb-2 mr-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
          Chance of skipping?
        </span>
        <Toggle
          checked={!!currentSetConfig?.enabled}
          onChange={() => void handleSkipToggle(layer)}
          size="md"
          activeColor="bg-[rgb(var(--color-primary))]"
          inactiveColor="bg-gray-300 dark:bg-gray-600"
          thumbColor="bg-[rgb(var(--color-primary))]"
          disabled={isDisabled}
        />
      </div>

      <AnimatePresence>
        {currentSetConfig?.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{
              type: 'spring',
              damping: 20,
              stiffness: 200,
              opacity: { duration: 0.2 },
            }}
            style={{ overflow: 'hidden' }}
          >
            <li className="relative">
              <div className={`${noneConfig.sets?.[currentSetId]?.locked ? 'opacity-50' : ''}`}>
                <div className="flex flex-col w-full gap-0.5">
                  <div className="flex flex-col xs:flex-row items-start xs:items-center w-full gap-0.5">
                    <div className="flex items-center w-full gap-0.5">
                      <div
                        className={`
                          ${baseStyleSmall}
                          justify-start w-full flex-1
                          ${isDisabled ? 'opacity-80' : ''}
                        `}
                      >
                        <div className="relative mr-2">
                          <FileIcon className="w-4 h-4" style={{ color: skipColor }} />
                          <svg
                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--color-quaternary))]"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                          Skip
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      <div
                        className={`
                          ${baseStyleSmall}
                          ${isDisabled ? 'opacity-80' : ''}
                        `}
                      >
                        <div className="flex items-center">
                          <SmallNumericStepper
                            value={currentSetConfig?.value ?? 0}
                            onChange={handleNumericChange}
                            disabled={isDisabled}
                            min={0}
                            max={getMaxValue(currentSetConfig?.value ?? 0)}
                            step={0.01}
                          />
                          <span className="mr-1 text-xs text-gray-600 dark:text-gray-400">%</span>
                        </div>
                      </div>

                      <div
                        className={`
                          ${baseStyleSmall}
                          ${isDisabled ? 'opacity-80' : ''}
                        `}
                      >
                        <LockButton
                          locked={isSkipLocked}
                          onClick={() => toggleLock(layer, 'None')}
                          className="h-6 py-0.5 w-[30px]"
                          disabled={isLayerLocked}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="px-1">
                    <ThinSlider
                      value={currentSetConfig?.value ?? 0}
                      max={getMaxValue(currentSetConfig?.value ?? 0)}
                      onChange={(newValue) => {
                        const event = {
                          target: { value: newValue.toString() },
                        } as React.ChangeEvent<HTMLInputElement>;
                        handleInputChange(event, layer, 'None');
                      }}
                      color={skipColor}
                      disabled={isDisabled}
                    />
                  </div>
                </div>
              </div>
            </li>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
