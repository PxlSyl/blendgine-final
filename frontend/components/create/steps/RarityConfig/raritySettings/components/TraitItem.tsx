import React, { useEffect, useState } from 'react';

import { TraitConfig } from '@/types/effect';

import { useLayerOrder } from '@/components/store/layerOrder/hook';
import { useColorStore } from '@/components/store/randomUI';
import { useStore } from '@/components/store';

import { capitalize, removeFileExtension } from '@/utils/functionsUtils';

import { LinkIcon, AttentionIcon } from '@/components/icons';
import LockButton from '@/components/shared/LockButton';
import { Card } from './Card';

import SmallNumericStepper from '@/components/shared/SmallNumericStepper';
import { ThinSlider } from '@/components/shared/ThinSlider';
import ImageTypeIcon from '@/components/shared/ImageTypeIcon';

interface TraitItemProps {
  layer: string;
  trait: string;
  config: TraitConfig;
  isLayerLocked: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>, layer: string, trait: string) => void;
  getMaxValue: (currentValue: number) => number;

  toggleLock: (layer: string, trait?: string) => void;
  traitIncompatibilities: Record<string, string[]>;
  traitForcedCombinations: Record<string, string[]>;
  imageInfos?: ReadonlyArray<{
    readonly name: string;
    readonly frame_count?: number;
    readonly is_single_frame?: boolean;
  }>;
}

export const TraitItem: React.FC<TraitItemProps> = ({
  layer,
  trait,
  config,
  isLayerLocked,
  handleInputChange,
  getMaxValue,
  toggleLock,
  traitIncompatibilities,
  traitForcedCombinations,
  imageInfos,
}) => {
  const { activeSetId } = useLayerOrder();
  const currentSetId = activeSetId ?? 'set1';
  const { getColorForKey } = useColorStore();
  const { themeName } = useStore();
  const [traitColor, setTraitColor] = useState('#000000');

  useEffect(() => {
    const color = getColorForKey(`${layer}-${trait}`);
    setTraitColor(color);
  }, [layer, trait, getColorForKey, themeName]);

  const traitValue = config.sets?.[currentSetId]?.value ?? 0;

  const isTraitLocked = config.sets?.[currentSetId]?.locked ?? false;
  const isDisabled = isLayerLocked || isTraitLocked || !config.sets[currentSetId]?.enabled;

  const handleNumericChange = (newValue: number) => {
    const event = {
      target: { value: newValue.toString() },
    } as React.ChangeEvent<HTMLInputElement>;
    handleInputChange(event, layer, trait);
  };

  const baseStyle =
    'bg-white/90 dark:bg-gray-700/90 hover:bg-gray-50/95 dark:hover:bg-gray-600/95 rounded-sm py-1 px-1 flex items-center min-h-[32px] text-sm backdrop-blur-sm border border-gray-300 dark:border-gray-600/30';

  const baseStyleSmall = baseStyle.replace('py-1', 'py-0.5');
  const baseStyleTraitName = `${baseStyleSmall} justify-start w-full flex-1`;

  return (
    <Card locked={isDisabled} onToggleLock={() => toggleLock(layer, trait)}>
      <div className={`${config.sets?.[currentSetId]?.locked ? 'opacity-80' : ''}`}>
        <div className="flex flex-col w-full gap-0.5">
          <div className="flex flex-col xs:flex-row items-start xs:items-center w-full gap-0.5">
            <div className="flex items-center w-full gap-0.5">
              <div
                className={`
                  ${baseStyleTraitName}
                  ${isDisabled ? 'opacity-80' : ''}
                `}
              >
                <ImageTypeIcon
                  imageInfos={imageInfos}
                  itemName={trait}
                  className="w-4 h-4 mr-2"
                  style={{ color: traitColor }}
                />
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  {capitalize(removeFileExtension(trait))}
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
                    value={traitValue}
                    onChange={handleNumericChange}
                    disabled={isDisabled}
                    min={0}
                    max={getMaxValue(traitValue)}
                    step={0.01}
                  />
                  <span className="ml-1 mr-1 text-xs text-gray-600 dark:text-gray-400">%</span>
                </div>
              </div>

              <div
                className={`${baseStyleSmall}
                  ${isDisabled ? 'opacity-50' : ''}
                `}
              >
                <LockButton
                  locked={isTraitLocked}
                  onClick={() => toggleLock(layer, trait)}
                  className="h-6 py-0.5 w-[30px]"
                  disabled={isLayerLocked}
                />
              </div>
            </div>
          </div>

          <div className="px-1">
            <ThinSlider
              value={traitValue}
              max={getMaxValue(traitValue)}
              onChange={(newValue) => {
                const event = {
                  target: { value: newValue.toString() },
                } as React.ChangeEvent<HTMLInputElement>;
                handleInputChange(event, layer, trait);
              }}
              color={traitColor}
              disabled={isDisabled}
            />
          </div>

          {Object.keys(traitIncompatibilities).length > 0 && (
            <div className="mt-1 p-2 rounded-sm bg-gray-100 dark:bg-gray-700">
              <div className="flex justify-between items-center">
                <div className="text-sm font-bold text-[rgb(var(--color-quaternary))] flex flex-row items-center">
                  <AttentionIcon className="w-5 h-5 animate-pulse mr-2" />
                  Incompatibilities:
                </div>
              </div>
              <ul className="list-disc pl-4 text-sm py-1">
                {Object.entries(traitIncompatibilities)
                  .sort(([layerA], [layerB]) => layerA.localeCompare(layerB))
                  .map(([incompatibleLayer, incompatibleTraits]) => (
                    <li key={incompatibleLayer} className="flex justify-between items-center">
                      <span>
                        {capitalize(removeFileExtension(incompatibleLayer))}:{' '}
                        {incompatibleTraits.map(capitalize).join(', ')}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {Object.keys(traitForcedCombinations).length > 0 && (
            <div className="mt-1 p-2 rounded-sm bg-gray-100 dark:bg-gray-700">
              <div className="flex justify-between items-center">
                <div className="text-sm font-bold text-[rgb(var(--color-accent))] flex flex-row items-center">
                  <LinkIcon className="w-5 h-5 animate-pulse mr-2" />
                  Forced Combinations:
                </div>
              </div>
              <ul className="list-disc pl-4 text-sm py-1">
                {Object.entries(traitForcedCombinations)
                  .sort(([layerA], [layerB]) => layerA.localeCompare(layerB))
                  .map(([forcedLayer, forcedTraits]) => (
                    <li key={forcedLayer} className="flex justify-between items-center">
                      <span>
                        {capitalize(removeFileExtension(forcedLayer))}:{' '}
                        {forcedTraits.map(capitalize).join(', ')}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
