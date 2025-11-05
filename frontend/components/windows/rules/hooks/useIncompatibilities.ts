import { useMemo, useCallback } from 'react';

import type { RarityConfig } from '@/types/effect';

import { asPromiseFn } from '@/utils/effect/effectPromiseUtils';

import { useIncompatibilitiesStore } from '@/components/windows/rules/store/incompatibilitiesStore';

export const useIncompatibilities = () => {
  const {
    incompatibilitySelectors,
    getActiveSetIncompatibilities,
    removeIncompatibility: storeRemoveIncompatibility,
    setActiveSet: storeSetIncompatibilitiesActiveSet,
    updateIncompatibilitySelector: storeUpdateIncompatibilitySelector,
    addIncompatibility: storeAddIncompatibility,
    resetIfInvalid: storeResetIfInvalid,
    cleanupIncompatibilities: storeCleanupIncompatibilities,
  } = useIncompatibilitiesStore();

  const addIncompatibility = useMemo(
    () => asPromiseFn(storeAddIncompatibility),
    [storeAddIncompatibility]
  );

  const updateIncompatibilitySelector = useMemo(
    () => asPromiseFn(storeUpdateIncompatibilitySelector),
    [storeUpdateIncompatibilitySelector]
  );

  const setIncompatibilitiesActiveSet = useMemo(
    () => asPromiseFn(storeSetIncompatibilitiesActiveSet),
    [storeSetIncompatibilitiesActiveSet]
  );

  const removeIncompatibility = useMemo(
    () => asPromiseFn(storeRemoveIncompatibility),
    [storeRemoveIncompatibility]
  );

  const resetIfInvalid = useCallback(
    (id: number, side: 'first' | 'second', rarityConfig: RarityConfig) => {
      storeResetIfInvalid(id, side, rarityConfig);
    },
    [storeResetIfInvalid]
  );

  const cleanupIncompatibilities = useCallback(
    (rarityConfig: RarityConfig) => {
      storeCleanupIncompatibilities(rarityConfig);
    },
    [storeCleanupIncompatibilities]
  );

  return {
    incompatibilitySelectors,
    getActiveSetIncompatibilities,
    addIncompatibility,
    updateIncompatibilitySelector,
    setIncompatibilitiesActiveSet,
    removeIncompatibility,
    resetIfInvalid,
    cleanupIncompatibilities,
  };
};
