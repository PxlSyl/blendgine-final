import { useEffect } from 'react';
import type { RarityConfig } from '@/types/effect';

interface UseCombinationValidationProps {
  id: number;
  firstCategory: string;
  firstItem: string;
  secondCategory: string;
  secondItem: string;
  activeSet: string;
  rarityConfig: RarityConfig | null;
  resetIfInvalid: (id: number, side: 'first' | 'second', rarityConfig: RarityConfig) => void;
  cleanupCombinations: (rarityConfig: RarityConfig) => void;
}

export const useCombinationValidation = ({
  id,
  firstCategory,
  firstItem,
  secondCategory,
  secondItem,
  activeSet,
  rarityConfig,
  resetIfInvalid,
  cleanupCombinations,
}: UseCombinationValidationProps) => {
  useEffect(() => {
    if (!rarityConfig) {
      return;
    }

    resetIfInvalid(id, 'first', rarityConfig);
    resetIfInvalid(id, 'second', rarityConfig);

    if (firstCategory && firstItem && secondCategory && secondItem) {
      cleanupCombinations(rarityConfig);
    }
  }, [
    firstCategory,
    firstItem,
    secondCategory,
    secondItem,
    id,
    rarityConfig,
    resetIfInvalid,
    cleanupCombinations,
  ]);

  const checkSelectionValid = (): boolean => {
    if (!rarityConfig) {
      return false;
    }

    return !!(
      firstCategory &&
      firstItem &&
      secondCategory &&
      secondItem &&
      rarityConfig[firstCategory]?.traits &&
      rarityConfig[secondCategory]?.traits &&
      rarityConfig[firstCategory]?.traits[firstItem]?.sets?.[activeSet]?.enabled &&
      rarityConfig[secondCategory]?.traits[secondItem]?.sets?.[activeSet]?.enabled
    );
  };

  return { checkSelectionValid };
};
