import React, { useEffect, useState } from 'react';

import type { ForcedCombinations, IncompatibilitySelectorType, RarityConfig } from '@/types/effect';

import { EffectOrPromise } from '@/utils/effect/effectPromiseUtils';

import CombinationSelector from '@/components/windows/rules/components/common/CombinationSelector';
import { useCombinationValidation } from '@/components/windows/rules/components/hooks/useCombinationValidation';

interface SelectorProps {
  selector: IncompatibilitySelectorType;
  rarityConfig: RarityConfig;
  orderedLayers: string[];
  activeSet: string;
  forcedCombinations?: ForcedCombinations;
  updateIncompatibilitySelector: (
    id: number,
    updates: Partial<IncompatibilitySelectorType>
  ) => Promise<void> | EffectOrPromise<void>;
  addIncompatibility: (
    layer1: string,
    trait1: string,
    layer2: string,
    trait2: string
  ) => Promise<void> | EffectOrPromise<void>;
  resetIfInvalid: (id: number, side: 'first' | 'second', rarityConfig: RarityConfig) => void;
  cleanupIncompatibilities: (rarityConfig: RarityConfig) => void;
  onAddIncompatibility?: () => void;
}

const IncompatibilitySelector: React.FC<SelectorProps> = ({
  selector,
  rarityConfig,
  orderedLayers,
  activeSet,
  forcedCombinations,
  updateIncompatibilitySelector,
  addIncompatibility,
  resetIfInvalid,
  cleanupIncompatibilities,
  onAddIncompatibility,
}) => {
  const { firstCategory, firstItem, secondCategory, secondItem } = selector;
  const [validationError, setValidationError] = useState<string | null>(null);

  const isItemsInForcedCombinations = useCombinationValidation({
    firstCategory,
    firstItem,
    secondCategory,
    secondItem,
    incompatibilitiesData: forcedCombinations,
  });

  useEffect(() => {
    if (!rarityConfig) {
      return;
    }

    if (firstCategory && firstItem && secondCategory && secondItem && rarityConfig) {
      if (
        !rarityConfig[firstCategory]?.traits ||
        !rarityConfig[secondCategory]?.traits ||
        !rarityConfig[firstCategory]?.traits[firstItem]?.sets?.[activeSet]?.enabled ||
        !rarityConfig[secondCategory]?.traits[secondItem]?.sets?.[activeSet]?.enabled
      ) {
        setValidationError(null);
        return;
      }

      if (isItemsInForcedCombinations) {
        setValidationError('This combination is already defined as a forced combination');
        return;
      }

      setValidationError(null);
    } else {
      setValidationError(null);
    }
  }, [
    firstCategory,
    firstItem,
    secondCategory,
    secondItem,
    rarityConfig,
    activeSet,
    forcedCombinations,
    isItemsInForcedCombinations,
  ]);

  const handleUpdateSelector = (id: number, updates: Partial<IncompatibilitySelectorType>) => {
    void updateIncompatibilitySelector(id, updates);
  };

  return (
    <CombinationSelector
      selector={selector}
      rarityConfig={rarityConfig}
      orderedLayers={orderedLayers}
      activeSet={activeSet}
      incompatibilitiesData={forcedCombinations}
      updateSelector={handleUpdateSelector}
      addCombination={addIncompatibility}
      resetIfInvalid={resetIfInvalid}
      cleanupCombinations={cleanupIncompatibilities}
      onAddCombination={onAddIncompatibility}
      title="Incompatibility"
      buttonText="Add Incompatibility"
      buttonColor="red"
      validationError={validationError}
      ruleType="incompatibility"
    />
  );
};

export default IncompatibilitySelector;
