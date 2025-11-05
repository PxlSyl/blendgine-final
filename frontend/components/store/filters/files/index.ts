import { create } from 'zustand';

import { api } from '@/services';
import { FilterStoreActions, FilterStoreState } from '../types';

const initialState: FilterStoreState = {
  sourceFolder: '',
  destinationFolder: '',
  hasUserSelectedFolders: false,
  flipOptions: {
    horizontalFlipPercentage: 0,
    verticalFlipPercentage: 0,
    includeInMetadata: true,
  },
  tintingOptions: {
    includeFilterInMetadata: true,
    pipelines: [
      {
        id: 'default_pipeline',
        name: 'Pipeline 1',
        effects: [],
        distributionPercentage: 100,
      },
    ],
    activePipelineId: 'default_pipeline',
  },
  selectedPaletteName: '',
  lastAdjustmentMade: false,
  exportFormat: 'png',
  isAnimated: false,
};

export const useFilterStore = create<FilterStoreState & FilterStoreActions>((set, get) => {
  let isInitialized = false;

  const initializeStore = async () => {
    if (isInitialized) {
      return;
    }

    try {
      await get().loadPersistedState();
      isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize store, using default state:', error);
      set(initialState);
      isInitialized = true;
    }
  };

  return {
    sourceFolder: '',
    destinationFolder: '',
    hasUserSelectedFolders: false,
    flipOptions: {
      horizontalFlipPercentage: 0,
      verticalFlipPercentage: 0,
      includeInMetadata: true,
    },
    tintingOptions: {
      includeFilterInMetadata: true,
      pipelines: [],
      activePipelineId: '',
    },
    selectedPaletteName: '',
    lastAdjustmentMade: false,
    exportFormat: 'png',
    isAnimated: false,

    initializeStore,

    resetFilterStore: async () => {
      try {
        set(initialState);
        await get().saveState();
      } catch (error) {
        console.error('Error resetting filter store:', error);
      }
    },

    setSourceFolder: (folder) => {
      set((state) => ({
        ...state,
        sourceFolder: folder,
        hasUserSelectedFolders: true,
      }));
      void get().saveState();
    },

    setDestinationFolder: (folder) => {
      set((state) => ({
        ...state,
        destinationFolder: folder,
        hasUserSelectedFolders: true,
      }));
      void get().saveState();
    },

    setHasUserSelectedFolders: (value) => {
      set((state) => ({
        ...state,
        hasUserSelectedFolders: value,
      }));
      void get().saveState();
    },

    setExportFormat: (format) => {
      const animatedFormats = ['gif', 'webp', 'mp4', 'webm'];
      const isFormatAnimated = animatedFormats.includes(format.toLowerCase());

      set((state) => ({
        ...state,
        exportFormat: format,
        isAnimated: isFormatAnimated,
      }));

      void get().saveState();
    },

    setIsAnimated: (isAnimated) => {
      set((state) => ({
        ...state,
        isAnimated,
      }));
      void get().saveState();
    },

    syncExportFormatWithLastCollection: async () => {
      try {
        const lastCollection = await api.getLastCreatedCollection();
        if (lastCollection) {
          const imageSetupState = await api.loadImageSetupState();
          if (imageSetupState && imageSetupState.imageFormat) {
            get().setExportFormat(imageSetupState.imageFormat);
          }
        }
      } catch (error) {
        console.error('Error syncing export format with last collection:', error);
      }
    },

    setFlipOptions: (options) => {
      set((state) => {
        const newState = {
          ...state,
          flipOptions: {
            ...state.flipOptions,
            horizontalFlipPercentage:
              options.horizontalFlipPercentage ?? state.flipOptions.horizontalFlipPercentage,
            verticalFlipPercentage:
              options.verticalFlipPercentage ?? state.flipOptions.verticalFlipPercentage,
            includeInMetadata: options.includeInMetadata ?? state.flipOptions.includeInMetadata,
          },
        };
        void get().saveState();
        return newState;
      });
    },

    setTintingState: (newState) => {
      set((state) => {
        const mergedTintingOptions = {
          ...state.tintingOptions,
          ...newState.tintingOptions,
          pipelines: newState.tintingOptions.pipelines || state.tintingOptions.pipelines,
          includeFilterInMetadata:
            newState.tintingOptions.includeFilterInMetadata ??
            state.tintingOptions.includeFilterInMetadata,
          activePipelineId:
            newState.tintingOptions.activePipelineId ?? state.tintingOptions.activePipelineId,
        };
        return {
          ...state,
          tintingOptions: mergedTintingOptions,
          selectedPaletteName: newState.selectedPaletteName ?? state.selectedPaletteName,
          lastAdjustmentMade: newState.lastAdjustmentMade ?? false,
        };
      });
      void get().saveState();
    },

    loadPersistedState: async () => {
      try {
        const savedState = await api.loadFilterState();
        if (savedState) {
          set((state) => ({
            ...state,
            sourceFolder: savedState.sourceFolder || state.sourceFolder,
            destinationFolder: savedState.destinationFolder || state.destinationFolder,
            hasUserSelectedFolders:
              savedState.hasUserSelectedFolders ?? state.hasUserSelectedFolders,
            exportFormat: savedState.exportFormat || state.exportFormat,
            isAnimated: savedState.isAnimated ?? state.isAnimated,
            flipOptions: savedState.flipOptions || state.flipOptions,
            tintingOptions: {
              ...state.tintingOptions,
              includeFilterInMetadata:
                savedState.tintingOptions?.includeFilterInMetadata ??
                state.tintingOptions.includeFilterInMetadata,
              pipelines: savedState.tintingOptions?.pipelines || state.tintingOptions.pipelines,
              activePipelineId:
                savedState.tintingOptions?.activePipelineId ??
                state.tintingOptions.activePipelineId,
            },
            selectedPaletteName: savedState.selectedPaletteName || state.selectedPaletteName,
            lastAdjustmentMade: savedState.lastAdjustmentMade ?? state.lastAdjustmentMade,
          }));
        } else {
          console.warn('[FilterStore] No saved state found, preserving current state');
        }
      } catch (error) {
        console.error('[FilterStore] Error loading persisted state:', error);
      }
    },

    saveState: async () => {
      try {
        const state = get();
        const stateToSave = {
          sourceFolder: state.sourceFolder,
          destinationFolder: state.destinationFolder,
          hasUserSelectedFolders: state.hasUserSelectedFolders,
          flipOptions: state.flipOptions,
          tintingOptions: {
            includeFilterInMetadata: state.tintingOptions.includeFilterInMetadata,
            pipelines: state.tintingOptions.pipelines,
            activePipelineId: state.tintingOptions.activePipelineId,
          },
          selectedPaletteName: state.selectedPaletteName,
          lastAdjustmentMade: state.lastAdjustmentMade,
          exportFormat: state.exportFormat,
          isAnimated: state.isAnimated,
        };

        await api.saveFilterState(stateToSave);
      } catch (error) {
        console.error('Error saving filter state:', error);
      }
    },
  };
});
