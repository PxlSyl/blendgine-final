import { StateCreator } from 'zustand';

import { api } from '@/services';

import type { LayerOrderState, LayerOrderActions } from '../types';
import type { RarityConfig, SetInfo } from '@/types/effect';

import {
  cleanSetReferencesInRarityConfig,
  cloneLayerTraitsForSet,
  createUniqueSetName,
  distributeValuesAmongTraits,
  emitSetsUpdated,
  ensureMutableSets,
  getNextSetId,
  initializeLayerTraitsForSet,
  updatePossibleCombinations,
} from './utils';
import { usePreview3DStore } from '../../preview3Dstore';
import { SaveLoadSlice, createSaveLoadSlice } from './saveLoadSlice';

interface SetSliceState {
  sets: Record<string, SetInfo>;
  activeSetId: string | null;
}

interface SetSliceActions extends SaveLoadSlice {
  setActiveSet: (setNumber: number) => void;
  addSet: () => void;
  duplicateSet: (setNumberToDuplicate: number) => void;
  deleteSet: (setNumber: number) => void;
  updateSetNFTCount: (setId: string, count: number) => void;
  setCustomSetName: (setNumber: number, customName: string) => void;
  getTotalNFTCount: () => number;
}

export type SetSlice = SetSliceState & SetSliceActions;

export const createSetSlice: StateCreator<
  LayerOrderState & LayerOrderActions,
  [],
  [],
  SetSliceActions
> = (set, get, store) => ({
  ...createSaveLoadSlice(set, get, store),

  setActiveSet: (setNumber: number) => {
    const setId = `set${setNumber}`;

    if (!get().sets[setId]) {
      console.error(`Set with id ${setId} not found`);
      return;
    }

    set({ activeSetId: setId });

    const store = { set, get };
    void updatePossibleCombinations(store, 'setActiveSet');
    emitSetsUpdated().catch((error) => {
      console.error('Error emitting sets-updated event:', error);
    });
  },

  addSet: () => {
    try {
      const { sets, rarityConfig } = get();

      let newSetNumber = 1;
      while (sets[`set${newSetNumber}`]) {
        newSetNumber++;
      }
      const newSetId = `set${newSetNumber}`;

      const existingNames = Object.values(sets).map((set) => set.customName ?? set.name);
      const newSetName = createUniqueSetName(newSetNumber, existingNames);

      const allAvailableLayers = rarityConfig ? Object.keys(rarityConfig) : [];

      const newSet: SetInfo = {
        id: newSetId,
        name: `Set ${newSetNumber}`,
        customName: newSetName,
        createdAt: new Date().toISOString(),
        layers: Array.isArray(allAvailableLayers) ? [...allAvailableLayers] : [],
        nftCount: 10,
      };

      const newRarityConfig = { ...rarityConfig };
      Object.keys(newRarityConfig).forEach((layer) => {
        const layerConfig = newRarityConfig[layer];
        if (layerConfig?.traits) {
          initializeLayerTraitsForSet(layerConfig, 0, newSetId);
          distributeValuesAmongTraits(layerConfig.traits, newSetId);
        }
      });

      set((state) => {
        const newSets = ensureMutableSets({
          ...state.sets,
          [newSetId]: newSet,
        });

        const setOrders = Object.keys(newSets).map((id, index) => ({
          id,
          order: index,
        }));

        return {
          sets: newSets,
          activeSetId: newSetId,
          rarityConfig: newRarityConfig,
          expandedLayers: {
            ...state.expandedLayers,
            [newSetId]: {},
          },
          forcedTraits: {
            ...state.forcedTraits,
            [newSetId]: {},
          },
          setOrders,
        };
      });

      void get().saveState();
      void get().saveRarityConfig();
      void emitSetsUpdated();
      void usePreview3DStore.getState().triggerGeneration();
    } catch (error) {
      console.error('[addSet] Error:', error);
    }
  },

  duplicateSet: (setNumberToDuplicate: number) => {
    set((state: LayerOrderState) => {
      const sourceSetId = `set${setNumberToDuplicate}`;
      const sourceSet = Object.values(state.sets).find((set) => set.id === sourceSetId);

      if (!sourceSet) {
        console.error(`Set with number ${setNumberToDuplicate} not found`);
        return state;
      }

      const newSetId = getNextSetId(state.sets);
      const nextSetNumber = parseInt(newSetId.replace('set', ''), 10);

      const sourceCustomName = sourceSet.customName ?? sourceSet.name;
      const newRarityConfig: RarityConfig = state.rarityConfig ? { ...state.rarityConfig } : {};

      Object.keys(newRarityConfig).forEach((layerName) => {
        const layerConfig = newRarityConfig[layerName];
        cloneLayerTraitsForSet(layerConfig, sourceSetId, newSetId);
        if (layerConfig.traits) {
          distributeValuesAmongTraits(layerConfig.traits, newSetId);
        }
      });

      const newForcedTraits = { ...state.forcedTraits };
      newForcedTraits[newSetId] = {};

      const newExpandedLayers = { ...state.expandedLayers };
      newExpandedLayers[newSetId] = { ...state.expandedLayers[sourceSetId] };

      const newSetName = sourceCustomName ? `${sourceCustomName} (copy)` : `Set ${nextSetNumber}`;

      const newSetInfo = {
        id: newSetId,
        name: newSetName,
        createdAt: new Date().toISOString(),
        layers: Array.isArray(sourceSet.layers) ? [...sourceSet.layers] : [],
        nftCount: sourceSet.nftCount,
        customName: newSetName,
      };

      const newSets = ensureMutableSets({
        ...state.sets,
        [newSetId]: newSetInfo,
      });

      const setOrders = Object.keys(newSets).map((id, index) => ({
        id,
        order: index,
      }));

      return {
        ...state,
        sets: newSets,
        activeSetId: newSetId,
        rarityConfig: newRarityConfig,
        expandedLayers: newExpandedLayers,
        forcedTraits: newForcedTraits,
        setOrders,
      };
    });

    const store = { set, get };
    void updatePossibleCombinations(store, 'duplicateSet');
    void get().saveState();
    void get().saveRarityConfig();
    void usePreview3DStore.getState().triggerGeneration();
  },

  deleteSet: (setNumber: number) => {
    const setId = `set${setNumber}`;

    set((state) => {
      const newSets = { ...state.sets };
      delete newSets[setId];

      let newActiveSetId = state.activeSetId;
      if (state.activeSetId === setId) {
        const remainingSetIds = Object.keys(newSets);
        newActiveSetId = remainingSetIds[0] ?? '';
      }

      const newRarityConfig = state.rarityConfig ? { ...state.rarityConfig } : {};
      if (newRarityConfig) {
        cleanSetReferencesInRarityConfig(newRarityConfig, setId);
      }

      const newExpandedLayers = { ...state.expandedLayers };
      if (newExpandedLayers[setId]) {
        delete newExpandedLayers[setId];
      }

      const newForcedTraits = { ...state.forcedTraits };
      if (newForcedTraits[setId]) {
        delete newForcedTraits[setId];
      }

      const setOrders = Object.keys(newSets).map((id, index) => ({
        id,
        order: index,
      }));

      return {
        ...state,
        sets: newSets,
        activeSetId: newActiveSetId,
        rarityConfig: newRarityConfig,
        expandedLayers: newExpandedLayers,
        forcedTraits: newForcedTraits,
        setOrders,
      };
    });

    try {
      Promise.all([api.loadIncompatibilityState(), api.loadForcedCombinationState()])
        .then(([incompatibilities, forcedCombinations]) => {
          const newIncompatibilities = { ...incompatibilities };
          const newForcedCombinations = { ...forcedCombinations };

          if (newIncompatibilities[setId]) {
            delete newIncompatibilities[setId];
          }

          if (newForcedCombinations[setId]) {
            delete newForcedCombinations[setId];
          }

          return Promise.all([
            api.saveIncompatibilityState(newIncompatibilities),
            api.saveForcedCombinationState(newForcedCombinations),
          ]);
        })
        .catch((error) => {
          console.error('Error cleaning up combinations data:', error);
        });
    } catch (error) {
      console.error('Error removing incompatibilities or forced combinations:', error);
    }

    const store = { set, get };
    void updatePossibleCombinations(store, 'deleteSet');
    void get().saveState();
    void get().saveRarityConfig();
    void usePreview3DStore.getState().triggerGeneration();

    emitSetsUpdated().catch((error) => {
      console.error('Error emitting sets-updated event:', error);
    });
  },

  updateSetNFTCount: (setId: string, count: number) => {
    set((state) => {
      const updatedSets = { ...state.sets };
      if (updatedSets[setId]) {
        updatedSets[setId] = {
          ...updatedSets[setId],
          nftCount: count,
        };
      }
      return { sets: updatedSets };
    });
    void get().saveState();
    const store = { set, get };
    void updatePossibleCombinations(store, 'updateSetNFTCount');
  },

  setCustomSetName: (setNumber: number, customName: string) => {
    set((state) => {
      const setId = `set${setNumber}`;
      const updatedSets = { ...state.sets };
      if (updatedSets[setId]) {
        updatedSets[setId] = {
          ...updatedSets[setId],
          customName,
        };
      }
      return { sets: updatedSets };
    });
    void get().saveState();
    emitSetsUpdated().catch((error) => {
      console.error('Error emitting sets-updated event:', error);
    });
  },

  getTotalNFTCount: () => {
    const state = get();
    return Object.values(state.sets).reduce((total, set) => total + (set.nftCount ?? 0), 0);
  },
});
