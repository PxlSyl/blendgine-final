import { StateCreator } from 'zustand';
import * as E from 'effect/Effect';
import { pipe } from 'effect/Function';

import type { RarityConfig, UpdateRarityAction } from '@/types/effect';

import { api } from '@/services';

import {
  getCurrentSetId,
  normalizeValue,
  getLayerConfig,
  ensureTraitSets,
  getActiveTraits,
  calculateTotalValue,
  redistributeExcessValue,
  normalizeAllTraitValues,
  isLayerLocked,
  isTraitEnabled,
  toggleTraitLock,
  toggleLayerLock,
  adjustTraitValue,
  ensureValidBlend,
  ensureTraitConfigRecord,
} from './utils';
import { CommonSlice, createCommonSlice } from './CommonSlice';
import { useProjectSetupStore } from '@/components/store/projectSetup/main';
import { useLayerOrderStore } from '@/components/store/layerOrder/main';

export interface MainSlice extends CommonSlice {
  getProjectSetupStore: () => ReturnType<typeof useProjectSetupStore.getState>;
  getRarity: (layer: string, trait: string) => number;
  adjustRarityValues: (layer: string, trait: string, newValue: number) => Promise<void>;
  updateRarity: (layer: string, trait: string, action: UpdateRarityAction) => Promise<void>;
  toggleLock: (layer: string, trait?: string) => Promise<void>;
  getActiveLayers: () => string[];
  addLayer: (layer: string) => Promise<void>;
  validateLayerProbabilities: (layer: string) => boolean;
  getOrderedLayers: () => string[];
  getRarityConfig: () => RarityConfig;
  setOrderedLayers: (layers: string[]) => void;
  setRarityConfig: (config: RarityConfig) => Promise<void>;
  submitRarityConfig: () => Promise<void>;
}

export const createMainSlice: StateCreator<MainSlice, [], [], MainSlice> = (set, get, store) => ({
  ...createCommonSlice(set, get, store),
  getProjectSetupStore: () => {
    return pipe(
      E.succeed(useProjectSetupStore.getState()),
      E.catchAll((error) => {
        console.error('Error getting project setup store:', error);
        return E.succeed(useProjectSetupStore.getState());
      }),
      E.runSync
    );
  },

  getRarity: (layer: string, trait: string): number => {
    return pipe(
      E.Do,
      E.bind('currentSetId', () => E.succeed(getCurrentSetId())),
      E.bind('rarityConfig', () => E.succeed(useLayerOrderStore.getState().rarityConfig)),
      E.bind('layerConfig', ({ rarityConfig }) => E.succeed(rarityConfig[layer])),
      E.flatMap(({ currentSetId, layerConfig }) => {
        if (!layerConfig?.traits?.[trait]) {
          return E.succeed(0);
        }

        const traitSets = layerConfig.traits[trait].sets;
        if (!traitSets?.[currentSetId]) {
          return E.succeed(0);
        }

        if (!traitSets[currentSetId].enabled) {
          return E.succeed(0);
        }

        return E.succeed(layerConfig.traits?.[trait]?.sets?.[currentSetId]?.value || 0);
      }),
      E.catchAll((error) => {
        console.error('Error getting rarity:', error);
        return E.succeed(0);
      }),
      E.runSync
    );
  },

  adjustRarityValues: (layer: string, trait: string, newValue: number) => {
    return pipe(
      E.Do,
      E.bind('currentSetId', () => E.succeed(getCurrentSetId())),
      E.bind('rarityConfig', () => E.succeed(useLayerOrderStore.getState().rarityConfig)),
      E.bind('layerConfig', () => E.succeed(getLayerConfig(layer))),
      E.flatMap(({ currentSetId, rarityConfig, layerConfig }) => {
        if (!layerConfig?.traits) {
          return E.succeed(undefined);
        }

        const newTraits = ensureTraitConfigRecord(layerConfig.traits);
        ensureTraitSets(newTraits[trait], currentSetId);

        if (!newTraits[trait].sets[currentSetId]) {
          newTraits[trait].sets[currentSetId] = {
            blend: ensureValidBlend(layerConfig.defaultBlend),
            zIndex: 0,
            enabled: true,
            value: normalizeValue(newValue),
          };
        } else {
          newTraits[trait].sets[currentSetId] = {
            ...newTraits[trait].sets[currentSetId],
            value: normalizeValue(newValue),
          };
        }

        const activeTraits = getActiveTraits(newTraits, currentSetId);
        const total = calculateTotalValue(activeTraits, currentSetId);

        if (total > 100) {
          const excess = normalizeValue(total - 100);
          redistributeExcessValue(newTraits, activeTraits, trait, excess, currentSetId);
        }

        normalizeAllTraitValues(newTraits, currentSetId);

        const newConfig = {
          ...rarityConfig,
          [layer]: {
            ...layerConfig,
            traits: newTraits,
          },
        };

        return pipe(
          E.succeed(useLayerOrderStore.getState().setRarityConfig(newConfig as RarityConfig)),
          E.flatMap(() =>
            E.tryPromise({
              try: () => useLayerOrderStore.getState().saveState(),
              catch: (error) => new Error(`Failed to save state: ${String(error)}`),
            })
          ),
          E.flatMap(() =>
            E.tryPromise({
              try: () => useLayerOrderStore.getState().saveRarityConfig(),
              catch: (error) => new Error(`Failed to save rarity config: ${String(error)}`),
            })
          )
        );
      }),
      E.catchAll((error) => {
        console.error('Error adjusting rarity values:', error);
        return E.succeed(undefined);
      }),
      E.runPromise
    );
  },

  updateRarity: (layer: string, trait: string, action: UpdateRarityAction) => {
    return pipe(
      E.Do,
      E.bind('currentSetId', () => E.succeed(getCurrentSetId())),
      E.bind('rarityConfig', () => E.succeed(useLayerOrderStore.getState().rarityConfig)),
      E.bind('layerConfig', ({ rarityConfig }) => E.succeed(rarityConfig[layer])),
      E.flatMap(({ currentSetId, layerConfig }) => {
        if (!layerConfig?.traits || isLayerLocked(layerConfig, currentSetId)) {
          return E.succeed(undefined);
        }

        const traitConfig = layerConfig.traits[trait];
        if (!traitConfig?.sets?.[currentSetId]) {
          return E.succeed(undefined);
        }

        if (!isTraitEnabled(traitConfig, currentSetId)) {
          return E.succeed(undefined);
        }

        const currentValue = traitConfig.sets[currentSetId].value || 0;
        const step = Math.max(0.1, Math.min(5, currentValue * 0.1));
        let newValue = currentValue;

        if ('field' in action && action.field === 'value') {
          newValue = adjustTraitValue(traitConfig, currentSetId, step, action.value);
        }

        if (newValue !== currentValue) {
          return pipe(
            E.tryPromise({
              try: () => get().adjustRarityValues(layer, trait, newValue),
              catch: (error) => new Error(`Failed to adjust rarity values: ${String(error)}`),
            }),
            E.flatMap(() =>
              E.tryPromise({
                try: () => get().adjustForcedCombinationRarities(),
                catch: (error) =>
                  new Error(`Failed to adjust forced combination rarities: ${String(error)}`),
              })
            ),
            E.map(() => undefined)
          );
        }

        return E.succeed(undefined);
      }),
      E.catchAll((error) => {
        console.error('Error updating rarity:', error);
        return E.succeed(undefined);
      }),
      E.runPromise
    );
  },

  toggleLock: (layer: string, trait?: string) => {
    return pipe(
      E.Do,
      E.bind('currentSetId', () => E.succeed(getCurrentSetId())),
      E.bind('rarityConfig', () => E.succeed(useLayerOrderStore.getState().rarityConfig)),
      E.flatMap(({ currentSetId, rarityConfig }) => {
        const newConfig = { ...rarityConfig };

        if (trait) {
          toggleTraitLock(newConfig, layer, trait, currentSetId);
        } else {
          toggleLayerLock(newConfig, layer, currentSetId);
        }

        return E.succeed(
          useLayerOrderStore.getState().updateRarityConfig<RarityConfig>(() => newConfig)
        );
      }),
      E.catchAll((error) => {
        console.error('Error toggling lock:', error);
        return E.succeed(undefined);
      }),
      E.runPromise
    );
  },

  getActiveLayers: () => {
    return pipe(
      E.succeed(useLayerOrderStore.getState()),
      E.flatMap((store) => E.succeed(store.getActiveLayers() || [])),
      E.catchAll((error) => {
        console.error('Error getting active layers:', error);
        return E.succeed([]);
      }),
      E.runSync
    );
  },

  addLayer: (layer: string) => {
    return pipe(
      E.Do,
      E.bind('isValidLayer', () => E.succeed(layer && typeof layer === 'string')),
      E.flatMap(({ isValidLayer }) => {
        if (!isValidLayer) {
          console.error('Invalid layer name provided');
          return E.succeed(undefined);
        }

        return E.succeed(useLayerOrderStore.getState().addLayer(layer));
      }),
      E.catchAll((error) => {
        console.error('Error in addLayer:', error);
        return E.succeed(undefined);
      }),
      E.runPromise
    );
  },

  validateLayerProbabilities: (layer: string) => {
    return pipe(
      E.Do,
      E.bind('currentSetId', () => E.succeed(getCurrentSetId())),
      E.bind('rarityConfig', () => E.succeed(useLayerOrderStore.getState().rarityConfig)),
      E.bind('layerConfig', ({ rarityConfig }) => E.succeed(rarityConfig[layer])),
      E.flatMap(({ currentSetId, layerConfig }) => {
        if (!layerConfig?.traits) {
          console.warn(`Layer ${layer} not found in rarityConfig`);
          return E.succeed(true);
        }

        const enabledTraits = getActiveTraits(layerConfig.traits, currentSetId);
        const totalProbability = calculateTotalValue(enabledTraits, currentSetId);
        const tolerance = 0.1;

        return E.succeed(Math.abs(totalProbability - 100) <= tolerance);
      }),
      E.catchAll((error) => {
        console.error('Error validating layer probabilities:', error);
        return E.succeed(false);
      }),
      E.runSync
    );
  },

  getOrderedLayers: () => {
    return pipe(
      E.succeed(useLayerOrderStore.getState().getOrderedLayers()),
      E.map((layers) => layers || []),
      E.catchAll((error) => {
        console.error('Error getting ordered layers:', error);
        return E.succeed([]);
      }),
      E.runSync
    );
  },

  getRarityConfig: () => {
    return pipe(
      E.succeed(useLayerOrderStore.getState().rarityConfig),
      E.map((config) => config || {}),
      E.catchAll((error) => {
        console.error('Error getting rarity config:', error);
        return E.succeed({});
      }),
      E.runSync
    );
  },

  setOrderedLayers: (layers: string[]) => {
    return pipe(
      E.Do,
      E.bind('isValidLayers', () => E.succeed(Array.isArray(layers))),
      E.flatMap(({ isValidLayers }) => {
        if (!isValidLayers) {
          console.error('Invalid layers array provided');
          return E.succeed(undefined);
        }

        return E.succeed(useLayerOrderStore.getState().setOrderedLayers(layers));
      }),
      E.catchAll((error) => {
        console.error('Error setting ordered layers:', error);
        return E.succeed(undefined);
      }),
      E.runSync
    );
  },

  setRarityConfig: (config: RarityConfig) => {
    return pipe(
      E.Do,
      E.bind('isValidConfig', () => E.succeed(!!config)),
      E.flatMap(({ isValidConfig }) => {
        if (!isValidConfig) {
          console.error('Invalid config provided');
          return E.succeed(undefined);
        }

        const sanitizedConfig = JSON.parse(JSON.stringify(config)) as RarityConfig;

        return pipe(
          E.tryPromise({
            try: () => api.saveRarityConfig(sanitizedConfig),
            catch: (error) =>
              new Error(`Failed to save rarity config to backend: ${String(error)}`),
          }),
          E.flatMap(() =>
            E.succeed(useLayerOrderStore.getState().setRarityConfig(sanitizedConfig))
          ),
          E.flatMap(() =>
            E.tryPromise({
              try: () => useLayerOrderStore.getState().saveState(),
              catch: (error) => new Error(`Failed to save state: ${String(error)}`),
            })
          )
        );
      }),
      E.catchAll((error) => {
        console.error('Error setting rarity config:', error);
        return E.succeed(undefined);
      }),
      E.runPromise
    );
  },

  submitRarityConfig: () => {
    return pipe(
      E.Do,
      E.bind('rarityConfig', () => E.succeed(useLayerOrderStore.getState().rarityConfig)),
      E.flatMap(({ rarityConfig }) => {
        if (!rarityConfig) {
          return E.succeed(undefined);
        }

        return E.tryPromise({
          try: () => api.saveRarityConfig(rarityConfig),
          catch: (error) => new Error(`Failed to submit rarity config: ${String(error)}`),
        });
      }),
      E.catchAll((error) => {
        console.error('Error submitting rarity config:', error);
        return E.fail(error);
      }),
      E.runPromise
    );
  },
});
