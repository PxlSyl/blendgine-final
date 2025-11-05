import { useState, useCallback } from 'react';
import { EffectOrPromise, asPromiseFn } from '@/utils/effect/effectPromiseUtils';
import type { CombinationSelectorType } from '../index';
import type { RarityConfig } from '@/types/effect';

interface UseCombinationActionsProps {
  id: number;
  firstCategory: string;
  firstItem: string;
  secondCategory: string;
  secondItem: string;
  rarityConfig: RarityConfig;
  checkSelectionValid: () => boolean;
  addCombination: (
    layer1: string,
    trait1: string,
    layer2: string,
    trait2: string
  ) => Promise<void> | EffectOrPromise<void>;
  updateSelector: (id: number, updates: Partial<CombinationSelectorType>) => void;
  onAddCombination?: () => void;
}

export const useCombinationActions = ({
  id,
  firstCategory,
  firstItem,
  secondCategory,
  secondItem,
  rarityConfig,
  checkSelectionValid,
  addCombination,
  updateSelector,
  onAddCombination,
}: UseCombinationActionsProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);

  const handleAddCombination = useCallback(async () => {
    if (!rarityConfig || !checkSelectionValid()) {
      return;
    }

    setIsSubmitting(true);
    setOperationError(null);

    try {
      const addCombinationPromise = asPromiseFn(addCombination);
      await addCombinationPromise(firstItem, firstCategory, secondItem, secondCategory);

      updateSelector(id, {
        firstCategory: '',
        firstItem: '',
        secondCategory: '',
        secondItem: '',
      });

      if (onAddCombination) {
        onAddCombination();
      }
    } catch (error) {
      console.error('Error adding combination:', error);
      setOperationError(
        `Failed to add combination: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    rarityConfig,
    checkSelectionValid,
    firstItem,
    firstCategory,
    secondItem,
    secondCategory,
    addCombination,
    updateSelector,
    id,
    onAddCombination,
  ]);

  const clearOperationError = useCallback(() => {
    setOperationError(null);
  }, []);

  return {
    isSubmitting,
    operationError,
    handleAddCombination,
    clearOperationError,
  };
};
