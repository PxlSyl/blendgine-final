import { StateCreator } from 'zustand';

import type { LayerOrderState, LayerOrderActions } from '../types';
import type { RarityConfig } from '@/types/effect';
import { DEFAULT_BLEND_PROPERTIES } from '@/types/blendModes';

import { usePreview3DStore } from '@/components/store/layerOrder/preview3Dstore';

import { redistributeTraitValue, updatePossibleCombinations } from './utils';

export interface TraitSlice {
  toggleTraitDisabled: (layer: string, traitName: string) => void;
  setForcedTrait: (layer: string, trait: string) => void;
  removeForcedTrait: (layer: string) => void;
  isTraitEnabled: (layer: string, trait: string) => boolean;
}

export const createTraitSlice: StateCreator<
  LayerOrderState & LayerOrderActions,
  [],
  [],
  TraitSlice
> = (set, get) => ({
  toggleTraitDisabled: (layer: string, traitName: string) => {
    try {
      const activeSetId = get().activeSetId ?? 'set1';
      const activeSet = get().sets[activeSetId] ?? { layers: [] };
      const layerIndex = activeSet.layers.indexOf(layer);

      set((state) => {
        const newRarityConfig = JSON.parse(JSON.stringify(state.rarityConfig)) as RarityConfig;

        if (!newRarityConfig[layer]?.traits) {
          console.error(`[toggleTraitDisabled] Layer ${layer} not found or without traits`);
          return state;
        }

        const trait = newRarityConfig[layer].traits[traitName];
        if (!trait) {
          console.error(`[toggleTraitDisabled] Trait ${traitName} not found in layer ${layer}`);
          return state;
        }

        trait.sets ??= {};

        if (!trait.sets[activeSetId]) {
          trait.sets[activeSetId] = {
            blend: newRarityConfig[layer].defaultBlend ?? { ...DEFAULT_BLEND_PROPERTIES },
            zIndex: layerIndex * 100,
            enabled: true,
            value: 0,
          };
        }

        const oldValue = trait.sets[activeSetId].value;
        const wasEnabled = trait.sets[activeSetId].enabled;
        const newEnabledState = !wasEnabled;

        trait.sets[activeSetId].enabled = newEnabledState;

        if (wasEnabled && !newEnabledState) {
          trait.sets[activeSetId].value = 0;
          redistributeTraitValue(newRarityConfig[layer], traitName, oldValue, activeSetId);
        }

        const allTraitsDisabled = Object.values(newRarityConfig[layer].traits).every(
          (trait) => !trait.sets?.[activeSetId]?.enabled
        );

        if (allTraitsDisabled) {
          newRarityConfig[layer].sets ??= {};

          if (!newRarityConfig[layer].sets[activeSetId]) {
            newRarityConfig[layer].sets[activeSetId] = { active: false };
          } else {
            newRarityConfig[layer].sets[activeSetId].active = false;
          }
        } else {
          newRarityConfig[layer].sets ??= {};
          if (!newRarityConfig[layer].sets[activeSetId]) {
            newRarityConfig[layer].sets[activeSetId] = { active: true };
          } else {
            newRarityConfig[layer].sets[activeSetId].active = true;
          }
        }

        return { rarityConfig: newRarityConfig };
      });

      void get().saveRarityConfig();
      const store = { set, get };
      void updatePossibleCombinations(store, 'toggleTraitDisabled');

      const preview3DState = usePreview3DStore.getState();
      if (!preview3DState.isGenerating) {
        void preview3DState.triggerGeneration();
      }
    } catch (error) {
      console.error(`[toggleTraitDisabled] Error:`, error);
    }
  },

  setForcedTrait: (layer: string, trait: string) => {
    set((state) => {
      const activeSetId = state.activeSetId ?? 'set1';
      const newForcedTraits = { ...state.forcedTraits };

      newForcedTraits[activeSetId] ??= {};

      newForcedTraits[activeSetId][layer] = trait;

      return {
        forcedTraits: newForcedTraits,
      };
    });
    void get().saveState();

    const preview3DState = usePreview3DStore.getState();
    if (!preview3DState.isGenerating) {
      void preview3DState.triggerGeneration();
    }
  },

  removeForcedTrait: (layer: string) => {
    set((state) => {
      const activeSetId = state.activeSetId ?? 'set1';
      const newForcedTraits = { ...state.forcedTraits };

      if (!newForcedTraits[activeSetId]) {
        return state;
      }

      const newSetForcedTraits = Object.assign({}, newForcedTraits[activeSetId]);
      delete newSetForcedTraits[layer];
      newForcedTraits[activeSetId] = newSetForcedTraits;

      return { forcedTraits: newForcedTraits };
    });
    void get().saveState();
  },

  isTraitEnabled: (layer: string, trait: string) => {
    const activeSetId = get().activeSetId ?? 'set1';
    const traitConfig = get().rarityConfig[layer]?.traits?.[trait];
    return traitConfig?.sets?.[activeSetId]?.enabled ?? false;
  },
});
