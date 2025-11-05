import { StateCreator } from 'zustand';

import { DEFAULT_BLEND_PROPERTIES } from '@/types/blendModes';
import type { SetOrderedLayersArg } from '@/types/effect';
import type { LayerOrderState, LayerOrderActions } from '../types';

import {
  activateAllLayers,
  addLayerToRarityConfig,
  deactivateAllLayers,
  distributeValuesAmongTraits,
  getActiveLayersFromConfig,
  updateExpandedLayersForCollapseAll,
  updateExpandedLayersForExpandAll,
  updatePossibleCombinations,
  updateZIndexInRarityConfig,
} from './utils';

import { usePreview3DStore } from '@/components/store/layerOrder/preview3Dstore';
import { usePreviewCanvasStore } from '@/components/store/layerOrder/previewCanvasStore';

import { safeValidate } from '@/utils/effect/effectValidation';
import { SetOrderedLayersArgSchema } from '@/schemas/effect';

export interface LayersSlice {
  getAllActiveLayers: () => string[];
  moveLayer: (fromIndex: number, toIndex: number) => void;
  getOrderedLayers: () => string[];
  setOrderedLayers: (newLayers: SetOrderedLayersArg, targetSetId?: string) => void;
  isLayerActive: (layer: string) => boolean;
  toggleLayerDisabled: (layer: string) => void;
  toggleLayerExpansion: (layer: string) => void;
  getActiveLayers: () => string[];
  addLayer: (layer: string) => void;
  updateOrderedLayers: () => void;
  enableAllLayers: () => void;
  disableAllLayers: () => void;
  expandAllLayers: () => void;
  collapseAllLayers: () => void;
  calculatePossibleCombinations: () => void;
}

export const createLayersSlice: StateCreator<
  LayerOrderState & LayerOrderActions,
  [],
  [],
  LayersSlice
> = (set, get) => ({
  getActiveLayers: () => {
    const state = get();
    const activeSetId = state.activeSetId ?? 'set1';
    return getActiveLayersFromConfig(state.rarityConfig, activeSetId);
  },

  getAllActiveLayers: () => {
    const state = get();
    const activeSetId = state.activeSetId ?? 'set1';
    const allLayers = Object.keys(state.rarityConfig);

    return allLayers.filter((layer) => {
      const layerConfig = state.rarityConfig[layer];
      return (
        layerConfig?.sets?.[activeSetId]?.active === true &&
        Object.values(layerConfig.traits ?? {}).some((t) => t?.sets?.[activeSetId]?.enabled)
      );
    });
  },

  expandAllLayers: () => {
    set((state) => {
      const activeSetId = state.activeSetId ?? 'set1';
      const newExpandedLayers = updateExpandedLayersForExpandAll(
        state.expandedLayers,
        state.rarityConfig,
        activeSetId
      );
      return {
        ...state,
        expandedLayers: newExpandedLayers as LayerOrderState['expandedLayers'],
      };
    });

    void get().saveState();
  },

  collapseAllLayers: () => {
    set((state) => {
      const activeSetId = state.activeSetId ?? 'set1';
      const newExpandedLayers = updateExpandedLayersForCollapseAll(
        state.expandedLayers,
        state.rarityConfig,
        activeSetId
      );
      return {
        ...state,
        expandedLayers: newExpandedLayers as LayerOrderState['expandedLayers'],
      };
    });

    void get().saveState();
  },

  moveLayer: (fromIndex: number, toIndex: number) => {
    const activeSetId = get().activeSetId ?? 'set1';
    const state = get();
    const currentSet = state.sets[activeSetId];

    if (!currentSet || fromIndex === toIndex) {
      return;
    }

    const newLayers = [...currentSet.layers];
    const [movedItem] = newLayers.splice(fromIndex, 1);
    newLayers.splice(toIndex, 0, movedItem);

    set((state) => {
      const updatedSets = { ...state.sets };
      const updatedSet = { ...updatedSets[activeSetId], layers: [...newLayers] };
      updatedSets[activeSetId] = updatedSet;

      const newRarityConfig = updateZIndexInRarityConfig(
        state.rarityConfig,
        newLayers,
        activeSetId
      );

      return {
        ...state,
        sets: updatedSets,
        rarityConfig: newRarityConfig,
      };
    });

    usePreviewCanvasStore.getState().updateImagesOrder(newLayers);
    const preview3DState = usePreview3DStore.getState();
    if (!preview3DState.isGenerating) {
      preview3DState.updateMeshPositions();
    }

    const store = { set, get };
    void updatePossibleCombinations(store, 'moveLayer');
    void get().saveState();
    void get().saveRarityConfig();
  },

  getOrderedLayers: () => {
    const activeSetId = get().activeSetId ?? 'set1';
    const activeSet = get().sets[activeSetId];
    return activeSet ? activeSet.layers : [];
  },

  setOrderedLayers: (
    newLayers: string[] | { layers: string[]; nftCount: number },
    targetSetId?: string
  ) => {
    const validation = safeValidate(SetOrderedLayersArgSchema, newLayers);
    if (!validation.success) {
      console.error('Validation failed:', validation.errors);
      return;
    }

    const activeSetId = targetSetId ?? get().activeSetId ?? 'set1';

    set((state) => {
      const updatedSets = { ...state.sets };
      const updatedSet = { ...updatedSets[activeSetId] };

      if (Array.isArray(newLayers)) {
        updatedSet.layers = [...newLayers];
      } else if ('layers' in newLayers && Array.isArray(newLayers.layers)) {
        updatedSet.layers = [...newLayers.layers];
        if ('nftCount' in newLayers && typeof newLayers.nftCount === 'number') {
          updatedSet.nftCount = newLayers.nftCount;
        }
      } else {
        const [firstKey] = Object.keys(newLayers);
        if (firstKey && Array.isArray(newLayers[firstKey])) {
          updatedSet.layers = [...(newLayers[firstKey] as string[])];
        }
      }

      updatedSets[activeSetId] = {
        ...updatedSet,
      };

      return {
        ...state,
        sets: updatedSets,
      };
    });

    const store = { set, get };
    void updatePossibleCombinations(store, 'setOrderedLayers');
    void get().saveState();

    const preview3DState = usePreview3DStore.getState();
    if (!preview3DState.isGenerating) {
      void preview3DState.triggerGeneration();
    }
  },

  isLayerActive: (layer: string) => {
    const activeSetId = get().activeSetId ?? 'set1';
    return get().rarityConfig[layer]?.sets?.[activeSetId]?.active ?? false;
  },

  toggleLayerDisabled: (layer: string) => {
    try {
      const currentRarityConfig = JSON.parse(JSON.stringify(get().rarityConfig)) as ReturnType<
        typeof get
      >['rarityConfig'];

      set((state) => {
        const activeSetId = state.activeSetId ?? 'set1';
        const newRarityConfig = JSON.parse(
          JSON.stringify(state.rarityConfig)
        ) as typeof state.rarityConfig;

        if (!newRarityConfig[layer]) {
          console.error(`Layer ${layer} not found in rarityConfig`);
          return state;
        }

        newRarityConfig[layer].sets ??= {};

        newRarityConfig[layer].sets[activeSetId] ??= { active: false };

        const wasActive = newRarityConfig[layer].sets[activeSetId].active;
        const newActiveState = !wasActive;
        newRarityConfig[layer].sets[activeSetId].active = newActiveState;

        if (wasActive) {
          Object.keys(newRarityConfig[layer].traits ?? {}).forEach((traitName) => {
            const trait = newRarityConfig[layer].traits?.[traitName];
            if (!trait) {
              return;
            }

            trait.sets ??= {};

            trait.sets[activeSetId] ??= {
              enabled: false,
              value: 0,
              zIndex: 0,
              blend: DEFAULT_BLEND_PROPERTIES,
            };

            if (trait.sets[activeSetId]) {
              trait.sets[activeSetId].enabled = false;
              trait.sets[activeSetId].value = 0;
            }
          });
        } else {
          Object.keys(newRarityConfig[layer].traits ?? {}).forEach((traitName) => {
            const trait = newRarityConfig[layer].traits?.[traitName];
            if (!trait) {
              return;
            }

            trait.sets ??= {};

            trait.sets[activeSetId] ??= {
              enabled: true,
              value: 0,
              zIndex: 0,
              blend: DEFAULT_BLEND_PROPERTIES,
            };

            if (trait.sets[activeSetId]) {
              trait.sets[activeSetId].enabled = true;
            }
          });

          distributeValuesAmongTraits(newRarityConfig[layer].traits ?? {}, activeSetId);
        }

        return { rarityConfig: newRarityConfig };
      });

      const updatedState = get().rarityConfig;
      if (!updatedState[layer]?.sets?.[get().activeSetId ?? 'set1']) {
        console.error(`[toggleLayerDisabled] Error: State not updated correctly`);
        set({ rarityConfig: currentRarityConfig });
        return;
      }

      void get().saveRarityConfig();
      const store = { set, get };
      void updatePossibleCombinations(store, 'toggleLayerDisabled');
      void usePreview3DStore.getState().triggerGeneration();
    } catch (error) {
      console.error('Error toggling layer disabled state:', error);
    }
  },

  toggleLayerExpansion: (layer: string) => {
    set((state) => {
      const activeSetId = state.activeSetId ?? 'set1';
      const newExpandedLayers = { ...state.expandedLayers };

      if (!newExpandedLayers[activeSetId]) {
        newExpandedLayers[activeSetId] = {};
      } else {
        newExpandedLayers[activeSetId] = Object.assign({}, newExpandedLayers[activeSetId]);
      }

      const isLayerActive = state.rarityConfig[layer]?.sets?.[activeSetId]?.active ?? false;
      const currentExpansionState = newExpandedLayers[activeSetId][layer] ?? false;
      const newExpansionState = isLayerActive ? !currentExpansionState : false;

      newExpandedLayers[activeSetId][layer] = newExpansionState;

      return { expandedLayers: newExpandedLayers };
    });

    void get().saveState();
  },

  addLayer: (layer: string) => {
    set((state) => {
      const activeSetId = state.activeSetId ?? 'set1';
      const activeSet = state.sets[activeSetId] ?? {
        id: activeSetId,
        name: `Set ${activeSetId.replace('set', '')}`,
        createdAt: new Date().toISOString(),
        layers: [],
        nftCount: 10,
        customName: `Set ${activeSetId.replace('set', '')}`,
      };

      const newLayers = [...(activeSet.layers ?? []), layer];
      const updatedRarityConfig = addLayerToRarityConfig(state.rarityConfig, layer, activeSetId);

      const updatedSets = { ...state.sets };
      updatedSets[activeSetId] = {
        ...activeSet,
        layers: newLayers,
      };

      return {
        rarityConfig: updatedRarityConfig,
        sets: updatedSets,
      };
    });

    const store = { set, get };
    void updatePossibleCombinations(store, 'addLayer');
    void get().saveState();
  },

  calculatePossibleCombinations: () => {
    const store = { set, get };
    void updatePossibleCombinations(store, 'manualCalculation');
  },

  enableAllLayers: () => {
    try {
      set((state) => {
        const activeSetId = state.activeSetId ?? 'set1';
        const newRarityConfig = activateAllLayers(state.rarityConfig, state.sets, activeSetId);
        return { rarityConfig: newRarityConfig };
      });

      void get().saveRarityConfig();
      const store = { set, get };
      void updatePossibleCombinations(store, 'enableAllLayers');
      void usePreview3DStore.getState().triggerGeneration();
    } catch (error) {
      console.error('[enableAllLayers] Error:', error);
    }
  },

  disableAllLayers: () => {
    try {
      set((state) => {
        const activeSetId = state.activeSetId ?? 'set1';
        const newRarityConfig = deactivateAllLayers(state.rarityConfig, activeSetId);
        return { rarityConfig: newRarityConfig };
      });

      void get().saveRarityConfig();
      const store = { set, get };
      void updatePossibleCombinations(store, 'disableAllLayers');
      void usePreview3DStore.getState().triggerGeneration();
    } catch (error) {
      console.error('[disableAllLayers] Error:', error);
    }
  },

  updateOrderedLayers: () => {
    const state = get();
    const activeSetId = state.activeSetId ?? 'set1';
    const activeSet = state.sets[activeSetId];

    if (!activeSet) {
      return;
    }

    const activeLayers = getActiveLayersFromConfig(state.rarityConfig, activeSetId);

    set((state) => {
      const updatedSets = { ...state.sets };
      if (updatedSets[activeSetId]) {
        updatedSets[activeSetId] = {
          ...updatedSets[activeSetId],
          layers: activeLayers,
        };
      }

      return { sets: updatedSets };
    });

    void get().saveState();
  },
});
