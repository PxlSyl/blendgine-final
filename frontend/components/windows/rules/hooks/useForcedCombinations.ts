import { useMemo, useCallback } from 'react';

import type { RarityConfig } from '@/types/effect';

import { asPromiseFn } from '@/utils/effect/effectPromiseUtils';

import { useForcedCombinationStore } from '@/components/windows/rules/store/forcedCombinationsStore';

export const useForcedCombinations = () => {
  const {
    forcedCombinationSelectors,
    getActiveSetForcedCombinations,
    removeForcedCombination: storeRemoveForcedCombination,
    setActiveSet: storeSetForcedCombinationActiveSet,
    updateForcedCombinationSelector: storeUpdateForcedCombinationSelector,
    addForcedCombination: storeAddForcedCombination,
    resetIfInvalid: storeResetForcedCombinationInvalid,
    cleanupForcedCombinations: storeCleanupForcedCombinations,
  } = useForcedCombinationStore();

  const addForcedCombination = useMemo(
    () => asPromiseFn(storeAddForcedCombination),
    [storeAddForcedCombination]
  );

  const updateForcedCombinationSelector = useMemo(
    () => asPromiseFn(storeUpdateForcedCombinationSelector),
    [storeUpdateForcedCombinationSelector]
  );

  const setForcedCombinationActiveSet = useMemo(
    () => asPromiseFn(storeSetForcedCombinationActiveSet),
    [storeSetForcedCombinationActiveSet]
  );

  const removeForcedCombination = useMemo(
    () => asPromiseFn(storeRemoveForcedCombination),
    [storeRemoveForcedCombination]
  );

  const resetIfInvalid = useCallback(
    (id: number, side: 'first' | 'second', rarityConfig: RarityConfig) => {
      storeResetForcedCombinationInvalid(id, side, rarityConfig);
    },
    [storeResetForcedCombinationInvalid]
  );

  const cleanupForcedCombinations = useCallback(
    (rarityConfig: RarityConfig) => {
      storeCleanupForcedCombinations(rarityConfig);
    },
    [storeCleanupForcedCombinations]
  );

  return {
    forcedCombinationSelectors,
    getActiveSetForcedCombinations,
    addForcedCombination,
    updateForcedCombinationSelector,
    setForcedCombinationActiveSet,
    removeForcedCombination,
    resetIfInvalid,
    cleanupForcedCombinations,
  };
};
