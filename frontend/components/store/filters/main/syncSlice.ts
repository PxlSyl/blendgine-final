import { StateCreator } from 'zustand';
import { api } from '@/services';
import type { TintingOptions } from '@/types/effect';
import type { TintingSliceState, TintingSliceActions } from '../types';
import { useFilterStore } from '../files';

export interface TintingState {
  tintingOptions: TintingOptions;
  selectedPaletteName: string;
  lastAdjustmentMade: boolean;
}

export interface SyncSlice {
  syncWithBackend: () => Promise<void>;
  loadFromBackend: () => Promise<void>;
  syncWithFilterStore: () => void;
  loadFromFilterStore: () => void;
}

export const createSyncSlice: StateCreator<
  TintingSliceState & TintingSliceActions,
  [],
  [],
  SyncSlice
> = (set, get) => ({
  syncWithBackend: async () => {
    const currentState = get();
    try {
      await api.updateEffectsState(currentState);
    } catch (error) {
      console.error('[TintingStore] Failed to sync with backend:', error, {
        tintingOptions: currentState.tintingOptions,
        selectedPaletteName: currentState.selectedPaletteName,
      });
    }
    get().syncWithFilterStore();
  },

  loadFromBackend: async () => {
    try {
      const backendState = await api.getEffectsState();
      const tintingState: TintingState = {
        tintingOptions: backendState.tintingOptions,
        selectedPaletteName: backendState.selectedPaletteName,
        lastAdjustmentMade: backendState.lastAdjustmentMade,
      };

      set(tintingState);
      get().syncWithFilterStore();
    } catch (error) {
      console.error('Failed to load tint state from backend:', error);
    }
  },

  syncWithFilterStore: () => {
    const currentState = get();
    const newState: TintingState = {
      tintingOptions: currentState.tintingOptions,
      selectedPaletteName: currentState.selectedPaletteName,
      lastAdjustmentMade: currentState.lastAdjustmentMade,
    };
    useFilterStore.getState().setTintingState(newState);
  },

  loadFromFilterStore: () => {
    const filterState = useFilterStore.getState();
    const newFilterState: TintingState = {
      tintingOptions: filterState.tintingOptions,
      selectedPaletteName: filterState.selectedPaletteName,
      lastAdjustmentMade: filterState.lastAdjustmentMade,
    };
    set(newFilterState);
  },
});
