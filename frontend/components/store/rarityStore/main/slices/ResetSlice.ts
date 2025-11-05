import { StateCreator } from 'zustand';
import * as E from 'effect/Effect';
import { pipe } from 'effect/Function';

import type { RarityConfig, LayerConfig } from '@/types/effect';

import {
  getCurrentSetId,
  isLayerLocked,
  resetTraitValues,
  handleNoneTraitReset,
  ensureTraitConfigRecord,
} from './utils';
import { CommonSlice, createCommonSlice } from './CommonSlice';
import { useLayerOrderStore } from '@/components/store/layerOrder/main';

export interface ResetSlice extends CommonSlice {
  resetAll: () => void;
  resetLayerRarity: (layer: string) => void;
}

const resetLayerConfig = (
  layer: string,
  layerConfig: LayerConfig,
  currentSetId: string
): E.Effect<RarityConfig, Error, never> => {
  return E.try({
    try: () => {
      const newTraits = ensureTraitConfigRecord(layerConfig.traits);
      resetTraitValues(newTraits, currentSetId, true);
      handleNoneTraitReset(newTraits, currentSetId, layerConfig);

      return {
        [layer]: {
          ...layerConfig,
          traits: newTraits,
        },
      };
    },
    catch: (error) => new Error(`Failed to reset layer ${layer}: ${String(error)}`),
  });
};

const updateRarityConfig = (
  updateFn: (config: RarityConfig) => RarityConfig
): E.Effect<void, Error, never> => {
  return E.try({
    try: () => {
      useLayerOrderStore.getState().updateRarityConfig<RarityConfig>(updateFn);
      return undefined;
    },
    catch: (error) => new Error(`Failed to update rarity config: ${String(error)}`),
  });
};

export const createResetSlice: StateCreator<ResetSlice, [], [], ResetSlice> = (
  set,
  get,
  store
) => ({
  ...createCommonSlice(set, get, store),
  resetAll: () => {
    void pipe(
      E.Do,
      E.bind('currentSetId', () => E.succeed(getCurrentSetId())),
      E.bind('config', () => E.succeed(useLayerOrderStore.getState().rarityConfig)),
      E.flatMap(({ currentSetId, config }) =>
        pipe(
          Object.entries(config),
          E.forEach(([layer, layerConfig]) => {
            if (isLayerLocked(layerConfig, currentSetId)) {
              return E.succeed({});
            }
            return resetLayerConfig(layer, layerConfig, currentSetId);
          }),
          E.map((layerConfigs) => Object.assign({}, ...layerConfigs) as RarityConfig),
          E.flatMap((newConfig) =>
            updateRarityConfig((config) => ({
              ...config,
              ...newConfig,
            }))
          )
        )
      ),
      E.flatMap(() => E.sync(() => get().adjustForcedCombinationRarities())),
      E.catchAll((error) => {
        console.error('Error resetting all rarity configurations:', error);
        return E.void;
      }),
      E.runPromise
    ).then(() => {});
  },

  resetLayerRarity: (layer: string) => {
    void pipe(
      E.Do,
      E.bind('currentSetId', () => E.succeed(getCurrentSetId())),
      E.bind('config', () => E.succeed(useLayerOrderStore.getState().rarityConfig)),
      E.flatMap(({ currentSetId, config }) => {
        const layerConfig = config[layer];
        if (!layerConfig?.traits || isLayerLocked(layerConfig, currentSetId)) {
          return E.void;
        }

        return pipe(
          resetLayerConfig(layer, layerConfig, currentSetId),
          E.flatMap((newConfig) =>
            updateRarityConfig((config) => ({
              ...config,
              ...newConfig,
            }))
          )
        );
      }),
      E.flatMap(() => E.sync(() => get().adjustForcedCombinationRarities())),
      E.catchAll((error) => {
        console.error('Error resetting layer rarity:', error);
        return E.void;
      }),
      E.runPromise
    ).then(() => {});
  },
});
