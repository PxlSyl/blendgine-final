import React from 'react';
import { motion } from 'framer-motion';
import { LayerSelector } from './LayerSelector';
import { TraitSelector } from './TraitSelector';
import type { RarityConfig } from '@/types/effect';

interface SideSelectorProps {
  side: 'first' | 'second';
  category: string;
  item: string;
  otherCategory: string;
  otherItem: string;
  orderedLayers: string[];
  activeSet: string;
  rarityConfig: RarityConfig;
  incompatibilitiesData?: Record<string, Record<string, string[]>>;
  ruleType: 'incompatibility' | 'forcedCombination';
  onCategoryChange: (value: string) => void;
  onItemChange: (value: string) => void;
}

export const SideSelector: React.FC<SideSelectorProps> = ({
  side,
  category,
  item,
  otherCategory,
  otherItem,
  orderedLayers,
  activeSet,
  rarityConfig,
  incompatibilitiesData,
  ruleType,
  onCategoryChange,
  onItemChange,
}) => {
  const handleCategoryChange = (value: string) => {
    onCategoryChange(value);
    onItemChange('');
  };

  return (
    <motion.div
      key={`${side}-${ruleType}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full sm:w-5/12"
    >
      <div className="flex flex-col space-y-2 w-full">
        <LayerSelector
          value={category}
          onChange={handleCategoryChange}
          otherCategory={otherCategory}
          orderedLayers={orderedLayers}
          activeSet={activeSet}
          rarityConfig={rarityConfig}
          ruleType={ruleType}
        />
        {category && rarityConfig?.[category]?.traits && (
          <TraitSelector
            value={item}
            onChange={onItemChange}
            category={category}
            otherCategory={otherCategory}
            otherItem={otherItem}
            activeSet={activeSet}
            rarityConfig={rarityConfig}
            incompatibilitiesData={incompatibilitiesData}
            ruleType={ruleType}
          />
        )}
      </div>
    </motion.div>
  );
};
