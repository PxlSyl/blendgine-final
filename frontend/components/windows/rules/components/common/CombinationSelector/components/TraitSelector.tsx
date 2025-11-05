import React from 'react';
import { capitalize, removeFileExtension } from '@/utils/functionsUtils';
import Dropdown from '@/components/shared/Dropdown';
import type { RarityConfig } from '@/types/effect';

interface TraitSelectorProps {
  value: string;
  onChange: (value: string) => void;
  category: string;
  otherCategory: string;
  otherItem: string;
  activeSet: string;
  rarityConfig: RarityConfig;
  incompatibilitiesData?: Record<string, Record<string, string[]>>;
  ruleType: 'incompatibility' | 'forcedCombination';
}

export const TraitSelector: React.FC<TraitSelectorProps> = ({
  value,
  onChange,
  category,
  otherCategory,
  otherItem,
  activeSet,
  rarityConfig,
  incompatibilitiesData,
  ruleType,
}) => {
  const isItemIncompatible = (itemName: string) => {
    if (otherCategory && otherItem && incompatibilitiesData) {
      const categoryData = incompatibilitiesData[category];
      const otherCategoryData = incompatibilitiesData[otherCategory];

      return (
        !!(categoryData?.[itemName]?.[otherCategory] as Record<string, unknown>)?.[otherItem] ||
        !!(otherCategoryData?.[otherItem]?.[category] as Record<string, unknown>)?.[itemName]
      );
    }
    return false;
  };

  const availableItems =
    category && rarityConfig?.[category]?.traits
      ? Object.keys(rarityConfig[category].traits)
          .filter((key) => {
            const traitConfig = rarityConfig?.[category]?.traits?.[key];
            const keyAsString = String(key);

            return (
              keyAsString.toLowerCase() !== 'none' &&
              traitConfig?.sets?.[activeSet]?.enabled === true &&
              !isItemIncompatible(keyAsString) &&
              !(otherCategory === category && key === otherItem)
            );
          })
          .map((key) => String(key))
          .sort((a, b) => a.localeCompare(b))
      : [];

  const textColorClass =
    ruleType === 'incompatibility'
      ? 'text-[rgb(var(--color-secondary))]'
      : 'text-[rgb(var(--color-accent))]';
  const selectedColor = ruleType === 'incompatibility' ? 'pink' : 'blue';

  return (
    <Dropdown
      options={availableItems}
      value={
        value && rarityConfig[category]?.traits?.[value]?.sets?.[activeSet]?.enabled
          ? capitalize(removeFileExtension(value))
          : ''
      }
      onChange={onChange}
      placeholder="Select Trait"
      textColorClass={textColorClass}
      hoverBgClass="hover:bg-gray-100 dark:hover:bg-gray-600"
      selectedColor={selectedColor}
    />
  );
};
