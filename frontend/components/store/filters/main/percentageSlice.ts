import { StateCreator } from 'zustand';
import type { TintingSliceState, TintingSliceActions } from '../types';
import { useFilterStore } from '../files';

export interface PercentageSlice {
  updatePipelineDistributionPercentage: (pipelineId: string, percentage: number) => void;
  getTotalDistributionPercentage: () => number;
  equalizePercentages: () => void;
  randomizePercentages: () => void;
  resetPercentages: () => void;
  getTotalPercentage: () => number;
}

export const createPercentageSlice: StateCreator<
  TintingSliceState & TintingSliceActions,
  [],
  [],
  PercentageSlice
> = (set, get) => ({
  updatePipelineDistributionPercentage: (pipelineId: string, percentage: number) =>
    set((state) => {
      if (percentage < 0 || percentage > 100 || isNaN(percentage)) {
        return state;
      }

      const currentTotal = state.tintingOptions.pipelines.reduce(
        (sum, p) => sum + p.distributionPercentage,
        0
      );

      const oldPipelinePercentage =
        state.tintingOptions.pipelines.find((p) => p.id === pipelineId)?.distributionPercentage ??
        0;
      const difference = percentage - oldPipelinePercentage;
      const newTotal = currentTotal + difference;

      if (newTotal > 100) {
        const otherPipelines = state.tintingOptions.pipelines.filter((p) => p.id !== pipelineId);
        const totalOtherPercentage = otherPipelines.reduce(
          (sum, p) => sum + p.distributionPercentage,
          0
        );

        if (totalOtherPercentage > 0) {
          const remainingPercentage = Math.max(0, 100 - percentage);
          const scaleFactor = remainingPercentage / totalOtherPercentage;

          const updatedPipelines = state.tintingOptions.pipelines.map((p) => {
            if (p.id === pipelineId) {
              return { ...p, distributionPercentage: percentage };
            }
            const newPercentage = Math.max(
              0,
              Math.min(100, p.distributionPercentage * scaleFactor)
            );
            return { ...p, distributionPercentage: newPercentage };
          });

          const newState = {
            ...state,
            tintingOptions: {
              ...state.tintingOptions,
              pipelines: updatedPipelines,
            },
          };

          useFilterStore.getState().setTintingState({
            tintingOptions: newState.tintingOptions,
            selectedPaletteName: newState.selectedPaletteName,
            lastAdjustmentMade: newState.lastAdjustmentMade,
          });

          return newState;
        }
      }

      const updatedPipelines = state.tintingOptions.pipelines.map((p) => {
        if (p.id === pipelineId) {
          return { ...p, distributionPercentage: percentage };
        }
        return p;
      });

      const newState = {
        ...state,
        tintingOptions: {
          ...state.tintingOptions,
          pipelines: updatedPipelines,
        },
      };

      useFilterStore.getState().setTintingState({
        tintingOptions: newState.tintingOptions,
        selectedPaletteName: newState.selectedPaletteName,
        lastAdjustmentMade: newState.lastAdjustmentMade,
      });

      return newState;
    }),

  getTotalDistributionPercentage: () => {
    const state = get();
    return state.tintingOptions.pipelines
      .filter((p) => p.distributionPercentage > 0)
      .reduce((total, p) => total + p.distributionPercentage, 0);
  },

  equalizePercentages: () =>
    set((state) => {
      const enabledPipelines = state.tintingOptions.pipelines.filter(
        (p) => p.distributionPercentage > 0
      );

      if (enabledPipelines.length === 0) {
        return state;
      }

      const equalPercentage = 100 / enabledPipelines.length;

      const updatedPipelines = state.tintingOptions.pipelines.map((p) => {
        if (p.distributionPercentage > 0) {
          return { ...p, distributionPercentage: equalPercentage };
        }
        return p;
      });

      const newState = {
        ...state,
        tintingOptions: {
          ...state.tintingOptions,
          pipelines: updatedPipelines,
        },
      };

      useFilterStore.getState().setTintingState({
        tintingOptions: newState.tintingOptions,
        selectedPaletteName: newState.selectedPaletteName,
        lastAdjustmentMade: newState.lastAdjustmentMade,
      });

      return newState;
    }),

  randomizePercentages: () =>
    set((state) => {
      const enabledPipelines = state.tintingOptions.pipelines.filter(
        (p) => p.distributionPercentage > 0
      );

      if (enabledPipelines.length === 0) {
        return state;
      }

      const randomPercentages: number[] = [];
      let remainingPercentage = 100;

      for (let i = 0; i < enabledPipelines.length - 1; i++) {
        const maxPercentage = remainingPercentage - (enabledPipelines.length - i - 1);
        const randomPercentage = Math.random() * maxPercentage;
        randomPercentages.push(randomPercentage);
        remainingPercentage -= randomPercentage;
      }
      randomPercentages.push(remainingPercentage);

      for (let i = randomPercentages.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [randomPercentages[i], randomPercentages[j]] = [randomPercentages[j], randomPercentages[i]];
      }

      let pipelineIndex = 0;
      const updatedPipelines = state.tintingOptions.pipelines.map((p) => {
        if (p.distributionPercentage > 0) {
          const percentage = randomPercentages[pipelineIndex];
          pipelineIndex++;
          return { ...p, distributionPercentage: percentage };
        }
        return p;
      });

      const newState = {
        ...state,
        tintingOptions: {
          ...state.tintingOptions,
          pipelines: updatedPipelines,
        },
      };

      useFilterStore.getState().setTintingState({
        tintingOptions: newState.tintingOptions,
        selectedPaletteName: newState.selectedPaletteName,
        lastAdjustmentMade: newState.lastAdjustmentMade,
      });

      return newState;
    }),

  resetPercentages: () =>
    set((state) => {
      const updatedPipelines = state.tintingOptions.pipelines.map((p) => ({
        ...p,
        distributionPercentage: p.distributionPercentage > 0 ? 100 : 0,
      }));

      const newState = {
        ...state,
        tintingOptions: {
          ...state.tintingOptions,
          pipelines: updatedPipelines,
        },
      };

      useFilterStore.getState().setTintingState({
        tintingOptions: newState.tintingOptions,
        selectedPaletteName: newState.selectedPaletteName,
        lastAdjustmentMade: newState.lastAdjustmentMade,
      });

      return newState;
    }),

  getTotalPercentage: () => {
    return get().getTotalDistributionPercentage();
  },
});
