import { StateCreator } from 'zustand';

import type { FilterInstance, FilterName, FilterOptions, EffectPipeline } from '@/types/effect';
import type { TintingSliceState, TintingSliceActions } from '../types';
import { MAX_FILTERS } from '@/components/create/steps/FiltersSetup/constants';
import { createDefaultFilter, generateFilterId } from './utils/filterUtils';
import { useFilterStore } from '../files';

export interface PipelineSlice {
  addFilterToActivePipeline: (filterType: FilterName) => void;
  removeFilterFromActivePipeline: (filterId: string) => void;
  removeAllFiltersFromActivePipeline: () => void;
  updateFilterInActivePipeline: (filterId: string, updates: Partial<FilterOptions>) => void;
  toggleFilterInActivePipeline: (filterId: string) => void;
  reorderFiltersInActivePipeline: (oldIndex: number, newIndex: number) => void;
  reorderPipelines: (activeId: string, overId: string) => void;
  getActivePipelineEffects: () => readonly FilterInstance[];
  getActivePipeline: () => { id: string; name: string; effects: readonly FilterInstance[] } | null;
  addPipeline: (name?: string) => void;
  removePipeline: (pipelineId: string) => void;
  setActivePipeline: (pipelineId: string) => void;
  updatePipelineName: (pipelineId: string, name: string) => void;
  duplicatePipeline: (pipelineId: string, newName?: string) => void;
}

export const createPipelineSlice: StateCreator<
  TintingSliceState & TintingSliceActions,
  [],
  [],
  PipelineSlice
> = (set, get) => ({
  addFilterToActivePipeline: (filterType: FilterName) =>
    set((state) => {
      const activePipeline = state.tintingOptions.pipelines.find(
        (p) => p.id === state.tintingOptions.activePipelineId
      );

      if (!activePipeline) {
        console.warn('No active pipeline');
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
        ...state,
        tintingOptions: {
          ...state.tintingOptions,
          pipelines: updatedPipelines,
        },
      };

      setTimeout(() => {
        useFilterStore.getState().setTintingState({
          tintingOptions: newState.tintingOptions,
          selectedPaletteName: newState.selectedPaletteName,
          lastAdjustmentMade: newState.lastAdjustmentMade,
        });
      }, 0);

      return newState;
    }),

  removeFilterFromActivePipeline: (filterId: string) =>
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
        ...state,
        tintingOptions: {
          ...state.tintingOptions,
          pipelines: updatedPipelines,
        },
      };

      setTimeout(() => {
        useFilterStore.getState().setTintingState({
          tintingOptions: newState.tintingOptions,
          selectedPaletteName: newState.selectedPaletteName,
          lastAdjustmentMade: newState.lastAdjustmentMade,
        });
      }, 0);

      return newState;
    }),

  removeAllFiltersFromActivePipeline: () =>
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
        ...state,
        tintingOptions: {
          ...state.tintingOptions,
          pipelines: updatedPipelines,
        },
      };

      setTimeout(() => {
        useFilterStore.getState().setTintingState({
          tintingOptions: newState.tintingOptions,
          selectedPaletteName: newState.selectedPaletteName,
          lastAdjustmentMade: newState.lastAdjustmentMade,
        });
      }, 0);

      return newState;
    }),

  updateFilterInActivePipeline: (filterId: string, updates: Partial<FilterOptions>) =>
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
        ...state,
        tintingOptions: {
          ...state.tintingOptions,
          pipelines: updatedPipelines,
        },
      };

      setTimeout(() => {
        useFilterStore.getState().setTintingState({
          tintingOptions: newState.tintingOptions,
          selectedPaletteName: newState.selectedPaletteName,
          lastAdjustmentMade: newState.lastAdjustmentMade,
        });
      }, 0);

      return newState;
    }),

  toggleFilterInActivePipeline: (filterId: string) =>
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
        ...state,
        tintingOptions: {
          ...state.tintingOptions,
          pipelines: updatedPipelines,
        },
      };

      setTimeout(() => {
        useFilterStore.getState().setTintingState({
          tintingOptions: newState.tintingOptions,
          selectedPaletteName: newState.selectedPaletteName,
          lastAdjustmentMade: newState.lastAdjustmentMade,
        });
      }, 0);

      return newState;
    }),

  reorderFiltersInActivePipeline: (oldIndex: number, newIndex: number) =>
    set((state) => {
      const activePipeline = state.tintingOptions.pipelines.find(
        (p) => p.id === state.tintingOptions.activePipelineId
      );

      if (!activePipeline) {
        return state;
      }

      const effects = [...activePipeline.effects];
      const [movedFilter] = effects.splice(oldIndex, 1);
      effects.splice(newIndex, 0, movedFilter);

      const updatedPipelines = state.tintingOptions.pipelines.map((p) =>
        p.id === activePipeline.id ? { ...p, effects } : p
      );

      const newState = {
        ...state,
        tintingOptions: {
          ...state.tintingOptions,
          pipelines: updatedPipelines,
        },
      };

      setTimeout(() => {
        useFilterStore.getState().setTintingState({
          tintingOptions: newState.tintingOptions,
          selectedPaletteName: newState.selectedPaletteName,
          lastAdjustmentMade: newState.lastAdjustmentMade,
        });
      }, 0);

      return newState;
    }),

  getActivePipelineEffects: () => {
    const state = get();
    const activePipeline = state.tintingOptions.pipelines.find(
      (p) => p.id === state.tintingOptions.activePipelineId
    );
    return activePipeline?.effects ?? [];
  },

  getActivePipeline: () => {
    const state = get();
    const activePipeline = state.tintingOptions.pipelines.find(
      (p) => p.id === state.tintingOptions.activePipelineId
    );
    return activePipeline
      ? {
          id: activePipeline.id,
          name: activePipeline.name,
          effects: activePipeline.effects,
        }
      : null;
  },

  addPipeline: (name?: string) =>
    set((state) => {
      const newPipeline: EffectPipeline = {
        id: `pipeline_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        name: name ?? `Pipeline ${state.tintingOptions.pipelines.length + 1}`,
        effects: [],
        distributionPercentage: 0,
      };

      const newState = {
        ...state,
        tintingOptions: {
          ...state.tintingOptions,
          pipelines: [...state.tintingOptions.pipelines, newPipeline],
          activePipelineId: newPipeline.id,
        },
      };

      setTimeout(() => {
        useFilterStore.getState().setTintingState({
          tintingOptions: newState.tintingOptions,
          selectedPaletteName: newState.selectedPaletteName,
          lastAdjustmentMade: newState.lastAdjustmentMade,
        });
      }, 0);

      return newState;
    }),

  removePipeline: (pipelineId: string) => {
    set((state) => {
      const updatedPipelines = state.tintingOptions.pipelines.filter((p) => p.id !== pipelineId);
      let newActivePipelineId = state.tintingOptions.activePipelineId;

      if (state.tintingOptions.activePipelineId === pipelineId) {
        newActivePipelineId = updatedPipelines.length > 0 ? updatedPipelines[0].id : undefined;
      }

      const newState = {
        ...state,
        tintingOptions: {
          ...state.tintingOptions,
          pipelines: updatedPipelines,
          activePipelineId: newActivePipelineId,
        },
      };

      setTimeout(() => {
        useFilterStore.getState().setTintingState({
          tintingOptions: newState.tintingOptions,
          selectedPaletteName: newState.selectedPaletteName,
          lastAdjustmentMade: newState.lastAdjustmentMade,
        });
      }, 0);

      return newState;
    });
  },

  setActivePipeline: (pipelineId: string) =>
    set((state) => {
      const newState = {
        ...state,
        tintingOptions: {
          ...state.tintingOptions,
          activePipelineId: pipelineId,
        },
      };

      setTimeout(() => {
        useFilterStore.getState().setTintingState({
          tintingOptions: newState.tintingOptions,
          selectedPaletteName: newState.selectedPaletteName,
          lastAdjustmentMade: newState.lastAdjustmentMade,
        });
      }, 0);

      return newState;
    }),

  updatePipelineName: (pipelineId: string, name: string) =>
    set((state) => {
      const updatedPipelines = state.tintingOptions.pipelines.map((p) =>
        p.id === pipelineId ? { ...p, name } : p
      );

      const newState = {
        ...state,
        tintingOptions: {
          ...state.tintingOptions,
          pipelines: updatedPipelines,
        },
      };

      setTimeout(() => {
        useFilterStore.getState().setTintingState({
          tintingOptions: newState.tintingOptions,
          selectedPaletteName: newState.selectedPaletteName,
          lastAdjustmentMade: newState.lastAdjustmentMade,
        });
      }, 0);

      return newState;
    }),

  duplicatePipeline: (pipelineId: string, newName?: string) =>
    set((state) => {
      const pipelineToDuplicate = state.tintingOptions.pipelines.find((p) => p.id === pipelineId);

      if (!pipelineToDuplicate) {
        return state;
      }

      const newPipeline: EffectPipeline = {
        id: `pipeline_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        name: newName ?? `${pipelineToDuplicate.name} (Copy)`,
        effects: pipelineToDuplicate.effects.map((effect) => ({
          ...effect,
          id: generateFilterId(effect.filterType),
        })),
        distributionPercentage: 0,
      };

      const newState = {
        ...state,
        tintingOptions: {
          ...state.tintingOptions,
          pipelines: [...state.tintingOptions.pipelines, newPipeline],
          activePipelineId: newPipeline.id,
        },
      };

      setTimeout(() => {
        useFilterStore.getState().setTintingState({
          tintingOptions: newState.tintingOptions,
          selectedPaletteName: newState.selectedPaletteName,
          lastAdjustmentMade: newState.lastAdjustmentMade,
        });
      }, 0);

      return newState;
    }),

  reorderPipelines: (activeId: string, overId: string) =>
    set((state) => {
      const pipelines = [...state.tintingOptions.pipelines];
      const oldIndex = pipelines.findIndex((p) => p.id === activeId);
      const newIndex = pipelines.findIndex((p) => p.id === overId);

      if (oldIndex === -1 || newIndex === -1) {
        return state;
      }

      const [movedPipeline] = pipelines.splice(oldIndex, 1);
      pipelines.splice(newIndex, 0, movedPipeline);

      const newState = {
        ...state,
        tintingOptions: {
          ...state.tintingOptions,
          pipelines,
        },
      };

      setTimeout(() => {
        useFilterStore.getState().setTintingState({
          tintingOptions: newState.tintingOptions,
          selectedPaletteName: newState.selectedPaletteName,
          lastAdjustmentMade: newState.lastAdjustmentMade,
        });
      }, 0);

      return newState;
    }),
});
