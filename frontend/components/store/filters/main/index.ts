import { create } from 'zustand';

import type { TintingSliceState, TintingSliceActions } from '../types';

import { createInitialState } from './initialState';
import { createFilterManagementSlice } from './filterManagementSlice';
import { createPercentageSlice } from './percentageSlice';
import { createMetadataSlice } from './metadataSlice';
import { createSyncSlice } from './syncSlice';
import { createPipelineSlice } from './pipelineSlice';
import { createUISlice, type UISlice } from './uiSlice';
import { useFilterStore } from '../files';

export const useTintingStore = create<TintingSliceState & TintingSliceActions & UISlice>()(
  (set, get, store) => ({
    ...createInitialState(),
    ...createFilterManagementSlice(set, get, store),
    ...createPercentageSlice(set, get, store),
    ...createMetadataSlice(set, get, store),
    ...createSyncSlice(set, get, store),
    ...createPipelineSlice(set, get, store),
    ...createUISlice(set, get, store),

    initializeTintingStore: async () => {
      try {
        const filterStore = useFilterStore.getState();
        await Promise.resolve();
        set((state) => ({
          ...state,
          tintingOptions: filterStore.tintingOptions,
          selectedPaletteName: filterStore.selectedPaletteName,
          lastAdjustmentMade: filterStore.lastAdjustmentMade,
        }));
      } catch (error) {
        console.error('Error initializing tinting store:', error);
      }
    },

    resetFiltersStore: async () => {
      try {
        set(createInitialState());
        return Promise.resolve();
      } catch (error) {
        console.error('Error resetting filters store:', error);
        return Promise.reject(error);
      }
    },
  })
);
