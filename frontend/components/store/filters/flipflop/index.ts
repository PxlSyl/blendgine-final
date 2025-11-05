import { create } from 'zustand';

import { api } from '@/services';

import type { FlipOptions } from '@/types/effect';
import type { FlipFlopActions, FlipFlopState } from '../types';

import { useFilterStore } from '../files';

const initialState: FlipFlopState = {
  flipOptions: {
    horizontalFlipPercentage: 0,
    verticalFlipPercentage: 0,
    includeInMetadata: true,
  },
};

export const useFlipFlopStore = create<FlipFlopState & FlipFlopActions>((set, get) => ({
  ...initialState,

  updateFlipOptions: (options: Partial<FlipOptions>) => {
    try {
      set((state) => {
        const newFlipOptions = { ...state.flipOptions, ...options };

        if (options.horizontalFlipPercentage !== undefined) {
          newFlipOptions.horizontalFlipPercentage = Math.min(
            100,
            Math.max(0, options.horizontalFlipPercentage)
          );
          if (
            newFlipOptions.horizontalFlipPercentage + newFlipOptions.verticalFlipPercentage >
            100
          ) {
            newFlipOptions.verticalFlipPercentage = Math.max(
              0,
              100 - newFlipOptions.horizontalFlipPercentage
            );
          }
        }
        if (options.verticalFlipPercentage !== undefined) {
          newFlipOptions.verticalFlipPercentage = Math.min(
            100,
            Math.max(0, options.verticalFlipPercentage)
          );
          if (
            newFlipOptions.horizontalFlipPercentage + newFlipOptions.verticalFlipPercentage >
            100
          ) {
            newFlipOptions.horizontalFlipPercentage = Math.max(
              0,
              100 - newFlipOptions.verticalFlipPercentage
            );
          }
        }

        useFilterStore.getState().setFlipOptions(newFlipOptions);
        void get().syncWithBackend();
        return { flipOptions: newFlipOptions };
      });
    } catch (error) {
      console.error('Error updating flip options:', error);
    }
  },

  syncWithBackend: async () => {
    try {
      const currentOptions = get().flipOptions;
      await api.updateFlipOptions(currentOptions);
    } catch (error) {
      console.error('Failed to sync flip options with backend:', error);
    }
  },

  loadFromBackend: async () => {
    try {
      const backendFlipOptions = await api.getFlipOptions();
      set({ flipOptions: backendFlipOptions });
      useFilterStore.getState().setFlipOptions(backendFlipOptions);
    } catch (error) {
      console.error('Failed to load flip options from backend:', error);
      set(initialState);
      useFilterStore.getState().setFlipOptions(initialState.flipOptions);
    }
  },

  toggleIncludeFlipFlopInMetadata: () => {
    try {
      set((state) => {
        const newFlipOptions = {
          ...state.flipOptions,
          includeInMetadata: !state.flipOptions.includeInMetadata,
        };
        useFilterStore.getState().setFlipOptions(newFlipOptions);
        void get().syncWithBackend();
        return { flipOptions: newFlipOptions };
      });
    } catch (error) {
      console.error('Error toggling include in metadata:', error);
    }
  },
}));
