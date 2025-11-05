import { StateCreator } from 'zustand';

import type { LayerOrderState, LayerOrderActions } from '../types';
import { BlendMode } from '@/types/blendModes';

import { updatePossibleCombinations } from './utils';
import { usePreview3DStore } from '@/components/store/layerOrder/preview3Dstore';

export interface BlendSlice {
  updateBlendMode: (layer: string, blendMode: BlendMode) => void;
  updateBlendOpacity: (layer: string, opacity: number) => void;
}

export const createBlendSlice: StateCreator<
  LayerOrderState & LayerOrderActions,
  [],
  [],
  BlendSlice
> = (set, get) => ({
  updateBlendMode: (layer: string, blendMode: BlendMode) => {
    try {
      set((state) => {
        const activeSetId = state.activeSetId ?? 'set1';
        const newRarityConfig = { ...state.rarityConfig };

        if (!newRarityConfig[layer]) {
          console.error(`[updateBlendMode] Layer ${layer} not found`);
          return state;
        }

        if (!newRarityConfig[layer].traits) {
          console.error(`[updateBlendMode] No traits found for layer ${layer}`);
          return state;
        }

        Object.values(newRarityConfig[layer].traits).forEach((trait) => {
          if (!trait.sets) {
            trait.sets = {};
          }
          if (!trait.sets[activeSetId]) {
            trait.sets[activeSetId] = {
              blend: { mode: blendMode, opacity: 1 },
              zIndex: 0,
              enabled: true,
              value: 0,
            };
          } else {
            trait.sets[activeSetId] = {
              ...trait.sets[activeSetId],
              blend: {
                ...trait.sets[activeSetId].blend,
                mode: blendMode,
              },
            };
          }
        });

        return { rarityConfig: newRarityConfig };
      });

      const store = { set, get };
      void updatePossibleCombinations(store, 'updateBlendMode');
      void get().saveState();
      void get().saveRarityConfig();

      const preview3DState = usePreview3DStore.getState();
      if (!preview3DState.isGenerating) {
        void preview3DState.triggerGeneration();
      }
    } catch (error) {
      console.error('[updateBlendMode] Error:', error);
    }
  },

  updateBlendOpacity: (layer: string, opacity: number) => {
    try {
      set((state) => {
        const activeSetId = state.activeSetId ?? 'set1';
        const newRarityConfig = { ...state.rarityConfig };

        if (!newRarityConfig[layer]) {
          console.error(`[updateBlendOpacity] Layer ${layer} not found`);
          return state;
        }

        if (!newRarityConfig[layer].traits) {
          console.error(`[updateBlendOpacity] No traits found for layer ${layer}`);
          return state;
        }

        Object.values(newRarityConfig[layer].traits).forEach((trait) => {
          if (!trait.sets) {
            trait.sets = {};
          }
          if (!trait.sets[activeSetId]) {
            trait.sets[activeSetId] = {
              blend: { mode: 'source-over', opacity },
              zIndex: 0,
              enabled: true,
              value: 0,
            };
          } else {
            trait.sets[activeSetId] = {
              ...trait.sets[activeSetId],
              blend: {
                ...trait.sets[activeSetId].blend,
                opacity,
              },
            };
          }
        });

        return { rarityConfig: newRarityConfig };
      });

      const store = { set, get };
      void updatePossibleCombinations(store, 'updateBlendOpacity');
      void get().saveState();
      void get().saveRarityConfig();

      const preview3DState = usePreview3DStore.getState();
      if (!preview3DState.isGenerating) {
        void preview3DState.triggerGeneration();
      }
    } catch (error) {
      console.error('[updateBlendOpacity] Error:', error);
    }
  },
});
