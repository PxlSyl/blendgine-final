import React from 'react';
import { AnimatePresence } from 'framer-motion';

import type { RarityConfig, ForcedCombinations } from '@/types/effect';
import { EffectOrPromise } from '@/utils/effect/effectPromiseUtils';

import { SideSelector, MiddleIcon, ValidationErrors, ActionButton } from './components';
import {
  useCombinationValidation,
  useCombinationActions,
  useSelectionHandlers,
  useCombinationState,
} from './hooks';

export interface CombinationSelectorType {
  id: number;
  firstCategory: string;
  firstItem: string;
  secondCategory: string;
  secondItem: string;
}

interface CombinationSelectorProps {
  selector: CombinationSelectorType;
  rarityConfig: RarityConfig | null;
  orderedLayers: string[];
  activeSet: string;
  incompatibilitiesData?: ForcedCombinations | null;
  updateSelector: (id: number, updates: Partial<CombinationSelectorType>) => void;
  addCombination: (
    layer1: string,
    trait1: string,
    layer2: string,
    trait2: string
  ) => Promise<void> | EffectOrPromise<void>;
  resetIfInvalid: (id: number, side: 'first' | 'second', rarityConfig: RarityConfig) => void;
  cleanupCombinations: (rarityConfig: RarityConfig) => void;
  onAddCombination?: () => void;
  title: string;
  buttonText: string;
  buttonColor?: 'purple' | 'blue' | 'pink' | 'red' | 'green';
  validationError?: string | null;
  ruleType: 'incompatibility' | 'forcedCombination';
}

const CombinationSelector: React.FC<CombinationSelectorProps> = ({
  selector,
  rarityConfig,
  orderedLayers,
  activeSet,
  incompatibilitiesData,
  updateSelector,
  addCombination,
  resetIfInvalid,
  cleanupCombinations,
  onAddCombination,
  title,
  buttonText,
  buttonColor = 'blue',
  validationError,
  ruleType,
}) => {
  const { id, firstCategory, firstItem, secondCategory, secondItem } = selector;

  const { checkSelectionValid } = useCombinationValidation({
    id,
    firstCategory,
    firstItem,
    secondCategory,
    secondItem,
    activeSet,
    rarityConfig,
    resetIfInvalid,
    cleanupCombinations,
  });

  const { isSubmitting, operationError, handleAddCombination } = useCombinationActions({
    id,
    firstCategory,
    firstItem,
    secondCategory,
    secondItem,
    rarityConfig: rarityConfig ?? {},
    checkSelectionValid,
    addCombination,
    updateSelector,
    onAddCombination,
  });

  const handleAddCombinationClick = () => {
    void handleAddCombination();
  };

  const {
    handleFirstCategoryChange,
    handleFirstItemChange,
    handleSecondCategoryChange,
    handleSecondItemChange,
  } = useSelectionHandlers({ id, updateSelector });

  const { isSelectionValid } = useCombinationState({
    checkSelectionValid,
    validationError,
  });

  return (
    <div className="space-y-4 p-2 rounded-sm shadow-md mb-2 relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div className="text-md font-semibold mb-2 text-[rgb(var(--color-primary))]">{title}</div>

      <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <AnimatePresence>
          <SideSelector
            side="first"
            category={firstCategory}
            item={firstItem}
            otherCategory={secondCategory}
            otherItem={secondItem}
            orderedLayers={orderedLayers}
            activeSet={activeSet}
            rarityConfig={rarityConfig ?? {}}
            incompatibilitiesData={
              incompatibilitiesData as Record<string, Record<string, string[]>> | undefined
            }
            ruleType={ruleType}
            onCategoryChange={handleFirstCategoryChange}
            onItemChange={handleFirstItemChange}
          />
        </AnimatePresence>

        <AnimatePresence>
          <MiddleIcon ruleType={ruleType} />
        </AnimatePresence>

        <AnimatePresence>
          <SideSelector
            side="second"
            category={secondCategory}
            item={secondItem}
            otherCategory={firstCategory}
            otherItem={firstItem}
            orderedLayers={orderedLayers}
            activeSet={activeSet}
            rarityConfig={rarityConfig ?? {}}
            incompatibilitiesData={
              incompatibilitiesData as Record<string, Record<string, string[]>> | undefined
            }
            ruleType={ruleType}
            onCategoryChange={handleSecondCategoryChange}
            onItemChange={handleSecondItemChange}
          />
        </AnimatePresence>
      </div>

      <ValidationErrors validationError={validationError} operationError={operationError} />

      <ActionButton
        onClick={handleAddCombinationClick}
        disabled={!isSelectionValid || isSubmitting}
        isSubmitting={isSubmitting}
        buttonText={buttonText}
        buttonColor={buttonColor}
      />
    </div>
  );
};

export default CombinationSelector;
