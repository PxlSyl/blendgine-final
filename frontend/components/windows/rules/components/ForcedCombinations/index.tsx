import React, { useEffect, useState } from 'react';

import type {
  ForcedCombinationSelectorType,
  Incompatibilities,
  RarityConfig,
} from '@/types/effect';

import { EffectOrPromise } from '@/utils/effect/effectPromiseUtils';

import CombinationSelector from '../common/CombinationSelector';
import { useCombinationValidation } from '../hooks/useCombinationValidation';

interface SelectorProps {
  selector: ForcedCombinationSelectorType;
  rarityConfig: RarityConfig;
  orderedLayers: string[];
  activeSet: string;
  incompatibilitiesData?: Incompatibilities;
  updateForcedCombinationSelector: (
    id: number,
    updates: Partial<ForcedCombinationSelectorType>
  ) => void;
  addForcedCombination: (
    layer1: string,
    trait1: string,
    layer2: string,
    trait2: string
  ) => Promise<void> | EffectOrPromise<void>;
  resetIfInvalid: (id: number, side: 'first' | 'second', rarityConfig: RarityConfig) => void;
  cleanupForcedCombinations: (rarityConfig: RarityConfig) => void;
  onAddForcedCombination?: () => void;
}

const ForcedCombinationSelector: React.FC<SelectorProps> = ({
  selector,
  rarityConfig,
  orderedLayers,
  activeSet,
  incompatibilitiesData,
  updateForcedCombinationSelector,
  addForcedCombination,
  resetIfInvalid,
  cleanupForcedCombinations,
  onAddForcedCombination,
}) => {
  const { firstCategory, firstItem, secondCategory, secondItem } = selector;
  const [validationError, setValidationError] = useState<string | null>(null);

  const isItemsInIncompatibilities = useCombinationValidation({
    firstCategory,
    firstItem,
    secondCategory,
    secondItem,
    incompatibilitiesData,
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

      if (isItemsInIncompatibilities) {
        setValidationError('This combination is already defined as an incompatibility');
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
    incompatibilitiesData,
    isItemsInIncompatibilities,
  ]);

  return (
    <CombinationSelector
      selector={selector}
      rarityConfig={rarityConfig}
      orderedLayers={orderedLayers}
      activeSet={activeSet}
      incompatibilitiesData={incompatibilitiesData}
      updateSelector={updateForcedCombinationSelector}
      addCombination={addForcedCombination}
      resetIfInvalid={resetIfInvalid}
      cleanupCombinations={cleanupForcedCombinations}
      onAddCombination={onAddForcedCombination}
      title="Forced Combination"
      buttonText="Add Forced Combination"
      buttonColor="purple"
      validationError={validationError}
      ruleType="forcedCombination"
    />
  );
};

export default ForcedCombinationSelector;
