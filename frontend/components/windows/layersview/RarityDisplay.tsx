import React, { useState } from 'react';

import Dropdown from '@/components/shared/Dropdown';
import { useLayersviewStore } from '@/components/windows/layersview/store';

const RarityDisplay: React.FC = () => {
  const { layerData } = useLayersviewStore();
  const [currentSetId, setCurrentSetId] = useState<string>('global');

  if (!layerData?.images[layerData.currentIndex]?.rarity) {
    return null;
  }

  const currentImage = layerData.images[layerData.currentIndex];
  const rarityData = currentImage.rarity;

  const setOptions = [
    {
      value: 'global',
      label: 'Global Rarity',
    },
    ...layerData.availableSets.map((set) => ({
      value: set.id,
      label: `Rarity for ${set.name}`,
    })),
  ];

  const currentRarity = rarityData[currentSetId];
  const displayedRarity =
    currentSetId === 'global' ? currentRarity.globalRarity : currentRarity.rarity;
  const rarityPercentage = Math.round(displayedRarity);

  const getRarityColor = (percentage: number) => {
    if (percentage <= 10) {
      return 'from-[rgb(var(--color-quaternary-light))] to-[rgb(var(--color-secondary-dark))]';
    }
    if (percentage <= 30) {
      return 'from-[rgb(var(--color-quinary-light))] to-[rgb(var(--color-secondary-dark))]';
    }
    return 'from-[rgb(var(--color-primary-light))] to-[rgb(var(--color-secondary-dark))]';
  };

  const getRarityTextColor = (percentage: number) => {
    if (percentage <= 10) {
      return 'text-[rgb(var(--color-quaternary))]';
    }
    if (percentage <= 30) {
      return 'text-[rgb(var(--color-quinary))]';
    }
    return 'text-[rgb(var(--color-primary))]';
  };

  const getCurrentDisplayName = () => {
    if (currentSetId === 'global') {
      return 'Global Rarity';
    }
    const currentSet = layerData.availableSets.find((set) => set.id === currentSetId);
    return currentSet ? `Rarity for ${currentSet.name}` : 'Global Rarity';
  };

  const hasMultipleSets = layerData.availableSets.length > 1;

  return (
    <div className="mt-2 mb-2">
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4"
        style={{ minHeight: '28px' }}
      >
        {hasMultipleSets ? (
          <div className="relative w-full sm:w-auto sm:flex-1" style={{ minWidth: '150px' }}>
            <Dropdown
              options={setOptions.map((opt) => opt.label)}
              value={getCurrentDisplayName()}
              placeholder="Select Set"
              onChange={(label) => {
                const option = setOptions.find((opt) => opt.label === label);
                if (option) {
                  setCurrentSetId(option.value);
                }
              }}
              textColorClass="text-gray-500 dark:text-gray-400 text-xs sm:text-sm"
              hoverBgClass="hover:bg-gray-50 dark:hover:bg-gray-600"
              renderOption={(label) => <div className="py-1 px-2">{label}</div>}
              renderValue={(value) => <div className="truncate max-w-[150px]">{value}</div>}
            />
          </div>
        ) : (
          <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 w-full sm:w-auto sm:flex-1">
            Rarity
          </span>
        )}

        <div className="flex items-center space-x-3 flex-1">
          <div className="px-2 py-0.5 rounded-sm text-xs font-medium bg-gray-100 dark:bg-gray-700 whitespace-nowrap">
            <span className={getRarityTextColor(rarityPercentage)}>{rarityPercentage}%</span>
          </div>
          <div className="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-sm overflow-hidden">
            <div
              className={`h-full rounded-sm bg-linear-to-r ${getRarityColor(rarityPercentage)}`}
              style={{ width: `${rarityPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RarityDisplay;
