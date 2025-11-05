import { StateCreator } from 'zustand';

import type { TintingSliceState, TintingSliceActions } from '../types';
import { useFilterStore } from '../files';

export interface MetadataSlice {
  toggleFilterMetadata: (filterId: string) => void;
  toggleIncludeFilterInMetadata: () => void;
}

export const createMetadataSlice: StateCreator<
  TintingSliceState & TintingSliceActions,
  [],
  [],
  MetadataSlice
> = (set) => ({
  toggleFilterMetadata: (filterId: string) =>
    set((state) => {
      const activePipeline = state.tintingOptions.pipelines.find(
        (p) => p.id === state.tintingOptions.activePipelineId
      );

      if (!activePipeline) {
        return state;
      }

      const updatedEffects = activePipeline.effects.map((filter) =>
        filter.id === filterId
          ? { ...filter, includeInMetadata: !filter.includeInMetadata }
          : filter
      );

      const updatedPipelines = state.tintingOptions.pipelines.map((p) =>
        p.id === activePipeline.id ? { ...p, effects: updatedEffects } : p
      );

      const newState = {
        ...state,
        tintingOptions: {
          ...state.tintingOptions,
          pipelines: updatedPipelines,
        },
      };

      setTimeout(() => void useFilterStore.getState().saveState(), 0);

      return newState;
    }),

  toggleIncludeFilterInMetadata: () =>
    set((state) => {
      const newState = {
        ...state,
        tintingOptions: {
          ...state.tintingOptions,
          includeFilterInMetadata: !state.tintingOptions.includeFilterInMetadata,
        },
      };

      setTimeout(() => void useFilterStore.getState().saveState(), 0);

      return newState;
    }),
});
