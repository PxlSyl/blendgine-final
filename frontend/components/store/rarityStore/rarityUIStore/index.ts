import { create } from 'zustand';

import type { ViewMode, ChartViewMode, RarityUIState } from './types';

import { useLayerOrderStore } from '@/components/store/layerOrder/main';
import { useGlobalRarityStore } from '@/components/store/rarityStore/globalRarityStore';

const initialState = {
  expandedLayers: {},
  viewMode: 'settings' as ViewMode,
  chartViewMode: 'bar' as ChartViewMode,
  selectedLayer: null,
  wasGlobalViewActive: false,
};

export const useRarityUIStore = create<RarityUIState>((set) => ({
  ...initialState,

  resetRarityUIStore: () => {
    set(initialState);
  },

  initializeLayers: (layers) =>
    set((state) => {
      const activeSetId = useLayerOrderStore.getState().activeSetId ?? 'set1';
      const newExpandedLayers = { ...state.expandedLayers };

      newExpandedLayers[activeSetId] ??= {};

      layers.forEach((layer) => {
        newExpandedLayers[activeSetId][layer] ??= true;
      });

      return { expandedLayers: newExpandedLayers };
    }),

  toggleLayer: (layerId) =>
    set((state) => {
      const activeSetId = useLayerOrderStore.getState().activeSetId ?? 'set1';
      const newExpandedLayers = { ...state.expandedLayers };

      newExpandedLayers[activeSetId] ??= {};

      return {
        expandedLayers: {
          ...newExpandedLayers,
          [activeSetId]: {
            ...newExpandedLayers[activeSetId],
            [layerId]: !newExpandedLayers[activeSetId][layerId],
          },
        },
      };
    }),

  setLayerExpanded: (layerId, isExpanded) =>
    set((state) => {
      const activeSetId = useLayerOrderStore.getState().activeSetId ?? 'set1';
      const newExpandedLayers = { ...state.expandedLayers };

      newExpandedLayers[activeSetId] ??= {};

      return {
        expandedLayers: {
          ...newExpandedLayers,
          [activeSetId]: {
            ...newExpandedLayers[activeSetId],
            [layerId]: isExpanded,
          },
        },
      };
    }),

  setViewMode: (mode) => {
    const globalRarityStore = useGlobalRarityStore.getState();
    const currentViewMode = useRarityUIStore.getState().viewMode;
    const layerOrderStore = useLayerOrderStore.getState();

    if (currentViewMode === 'visualization' && mode === 'settings') {
      set({ wasGlobalViewActive: globalRarityStore.isGlobalViewActive });

      if (globalRarityStore.isGlobalViewActive) {
        const { lastActiveSet } = globalRarityStore;

        globalRarityStore.setGlobalViewActive(false);

        if (lastActiveSet) {
          const setNumberMatch = lastActiveSet.match(/set(\d+)/);
          if (setNumberMatch?.[1]) {
            const setNumber = parseInt(setNumberMatch[1], 10);
            layerOrderStore.setActiveSet(setNumber);
          }
        }
      }
    } else if (currentViewMode === 'settings' && mode === 'visualization') {
      const wasGlobalActive = useRarityUIStore.getState().wasGlobalViewActive;

      if (wasGlobalActive) {
        globalRarityStore.setGlobalViewActive(true);
      }
    }

    set({ viewMode: mode });
  },

  setChartViewMode: (mode) => set({ chartViewMode: mode }),
  setSelectedLayer: (layer) => set({ selectedLayer: layer }),
  resetLayers: () => set({ expandedLayers: {} }),
}));
