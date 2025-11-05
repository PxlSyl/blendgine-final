import { StateCreator } from 'zustand';

import type { FilterInstance, FilterName, FilterOptions } from '@/types/effect';
import type { TintingSliceState, TintingSliceActions } from '../types';
import { MAX_FILTERS } from '@/components/create/steps/FiltersSetup/constants';
import { createDefaultFilter, generateFilterId } from './utils/filterUtils';
import { useFilterStore } from '../files';

export interface FilterManagementSlice {
  addFilter: (filterType: FilterName) => void;
  removeFilter: (filterId: string) => void;
  removeAllFilters: () => void;
  updateFilter: (filterId: string, updates: Partial<FilterOptions>) => void;
  toggleFilter: (filterId: string) => void;
}

export const createFilterManagementSlice: StateCreator<
  TintingSliceState & TintingSliceActions,
  [],
  [],
  FilterManagementSlice
> = (set) => ({
  addFilter: (filterType: FilterName) =>
    set((state) => {
      const activePipeline = state.tintingOptions.pipelines.find(
        (p) => p.id === state.tintingOptions.activePipelineId
      );

      if (!activePipeline) {
        return state;
      }

      if (activePipeline.effects.length >= MAX_FILTERS) {
        console.warn('Maximum number of filters reached');
        return state;
      }

      const newFilter: FilterInstance = {
        ...createDefaultFilter(filterType),
        id: generateFilterId(filterType),
      };

      const newEffects = [...activePipeline.effects, newFilter];

      const updatedPipelines = state.tintingOptions.pipelines.map((p) =>
        p.id === activePipeline.id ? { ...p, effects: newEffects } : p
      );

      const newState = {
        tintingOptions: {
          ...state.tintingOptions,
          pipelines: updatedPipelines,
        },
      };

      setTimeout(() => {
        useFilterStore.getState().setTintingState({
          tintingOptions: newState.tintingOptions,
          selectedPaletteName: state.selectedPaletteName,
          lastAdjustmentMade: state.lastAdjustmentMade,
        });
      }, 0);

      return newState;
    }),

  removeFilter: (filterId: string) =>
    set((state) => {
      const activePipeline = state.tintingOptions.pipelines.find(
        (p) => p.id === state.tintingOptions.activePipelineId
      );

      if (!activePipeline) {
        return state;
      }

      const newEffects = activePipeline.effects.filter((filter) => filter.id !== filterId);

      const updatedPipelines = state.tintingOptions.pipelines.map((p) =>
        p.id === activePipeline.id ? { ...p, effects: newEffects } : p
      );

      const newState = {
        tintingOptions: {
          ...state.tintingOptions,
          pipelines: updatedPipelines,
        },
      };

      setTimeout(() => {
        useFilterStore.getState().setTintingState({
          tintingOptions: newState.tintingOptions,
          selectedPaletteName: state.selectedPaletteName,
          lastAdjustmentMade: state.lastAdjustmentMade,
        });
      }, 0);

      return newState;
    }),

  removeAllFilters: () =>
    set((state) => {
      const activePipeline = state.tintingOptions.pipelines.find(
        (p) => p.id === state.tintingOptions.activePipelineId
      );

      if (!activePipeline) {
        return state;
      }

      const updatedPipelines = state.tintingOptions.pipelines.map((p) =>
        p.id === activePipeline.id ? { ...p, effects: [] } : p
      );

      const newState = {
        tintingOptions: {
          ...state.tintingOptions,
          pipelines: updatedPipelines,
        },
      };

      setTimeout(() => {
        useFilterStore.getState().setTintingState({
          tintingOptions: newState.tintingOptions,
          selectedPaletteName: state.selectedPaletteName,
          lastAdjustmentMade: state.lastAdjustmentMade,
        });
      }, 0);

      return newState;
    }),

  updateFilter: (filterId: string, updates: Partial<FilterOptions>) =>
    set((state) => {
      const activePipeline = state.tintingOptions.pipelines.find(
        (p) => p.id === state.tintingOptions.activePipelineId
      );

      if (!activePipeline) {
        return state;
      }

      const updatedEffects = activePipeline.effects.map((filter) =>
        filter.id === filterId ? { ...filter, ...updates } : filter
      );

      const updatedPipelines = state.tintingOptions.pipelines.map((p) =>
        p.id === activePipeline.id ? { ...p, effects: updatedEffects } : p
      );

      const newState = {
        tintingOptions: {
          ...state.tintingOptions,
          pipelines: updatedPipelines,
        },
      };

      setTimeout(() => {
        useFilterStore.getState().setTintingState({
          tintingOptions: newState.tintingOptions,
          selectedPaletteName: state.selectedPaletteName,
          lastAdjustmentMade: state.lastAdjustmentMade,
        });
      }, 0);

      return newState;
    }),

  toggleFilter: (filterId: string) =>
    set((state) => {
      const activePipeline = state.tintingOptions.pipelines.find(
        (p) => p.id === state.tintingOptions.activePipelineId
      );

      if (!activePipeline) {
        return state;
      }

      const updatedEffects = activePipeline.effects.map((filter) =>
        filter.id === filterId ? { ...filter, enabled: !filter.enabled } : filter
      );

      const updatedPipelines = state.tintingOptions.pipelines.map((p) =>
        p.id === activePipeline.id ? { ...p, effects: updatedEffects } : p
      );

      const newState = {
        tintingOptions: {
          ...state.tintingOptions,
          pipelines: updatedPipelines,
        },
      };

      setTimeout(() => {
        useFilterStore.getState().setTintingState({
          tintingOptions: newState.tintingOptions,
          selectedPaletteName: state.selectedPaletteName,
          lastAdjustmentMade: state.lastAdjustmentMade,
        });
      }, 0);

      return newState;
    }),
});
