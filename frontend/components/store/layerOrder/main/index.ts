import { create } from 'zustand';

import type { LayerOrderState, LayerOrderActions } from './types';

import { createInitialState } from './initialState';
import { emitSetsUpdated } from './slices/utils';
import {
  createSaveLoadSlice,
  createSetSlice,
  createLayersSlice,
  createBlendSlice,
  createTraitSlice,
  createSetOrderSlice,
} from './slices';

export const useLayerOrderStore = create<LayerOrderState & LayerOrderActions>()(
  (set, get, store) => ({
    ...createInitialState(),
    combinations: { loading: false, possibleCombinations: 0 },
    loading: false,
    ...createSaveLoadSlice(set, get, store),
    ...createSetSlice(set, get, store),
    ...createLayersSlice(set, get, store),
    ...createTraitSlice(set, get, store),
    ...createBlendSlice(set, get, store),
    ...createSetOrderSlice(set, get, store),

    resetLayerOrderStore: async () => {
      try {
        set(createInitialState());
        await emitSetsUpdated();
        return Promise.resolve();
      } catch (error) {
        console.error('Error resetting layer order store:', error);
        return Promise.reject(error);
      }
    },

    forceUpdate: () => {
      setTimeout(() => {
        set((state) => ({
          ...state,
          lastUpdate: performance.now(),
        }));
      }, 10);
    },
  })
);
