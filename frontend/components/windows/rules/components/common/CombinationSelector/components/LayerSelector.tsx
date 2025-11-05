import React from 'react';
import { capitalize, removeFileExtension } from '@/utils/functionsUtils';
import Dropdown from '@/components/shared/Dropdown';
import type { RarityConfig } from '@/types/effect';

interface LayerSelectorProps {
  value: string;
  onChange: (value: string) => void;
  otherCategory: string;
  orderedLayers: string[];
  activeSet: string;
  rarityConfig: RarityConfig;
  ruleType: 'incompatibility' | 'forcedCombination';
}

export const LayerSelector: React.FC<LayerSelectorProps> = ({
  value,
  onChange,
  otherCategory,
  orderedLayers,
  activeSet,
  rarityConfig,
  ruleType,
}) => {
  const availableCategories = orderedLayers
    .filter((t) => {
      return (
        t !== 'None' &&
        t !== otherCategory &&
        rarityConfig &&
        rarityConfig[t]?.sets?.[activeSet]?.active === true
      );
    })
    .map((trait) => String(trait))
    .sort((a, b) => a.localeCompare(b));

  const textColorClass =
    ruleType === 'incompatibility'
      ? 'text-[rgb(var(--color-secondary))]'
      : 'text-[rgb(var(--color-accent))]';
  const selectedColor = ruleType === 'incompatibility' ? 'pink' : 'blue';

  return (
    <Dropdown
      options={availableCategories}
      value={value ? capitalize(removeFileExtension(value)) : ''}
      onChange={onChange}
      placeholder="Select Layer"
      textColorClass={textColorClass}
      hoverBgClass="hover:bg-gray-100 dark:hover:bg-gray-600"
      selectedColor={selectedColor}
    />
  );
};
