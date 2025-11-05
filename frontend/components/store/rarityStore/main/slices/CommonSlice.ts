import { StateCreator } from 'zustand';
import * as E from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as A from 'effect/Array';

import type { RarityConfig, ForcedCombinations } from '@/types/effect';

import { getCurrentSetId, applyForcedCombinationAdjustments, normalizeLayerTraits } from './utils';
import { loadForcedCombinations } from './utils/loadForcedcombinations';

import { useLayerOrderStore } from '@/components/store/layerOrder/main';

let forcedCombinationsCache: { [setId: string]: ForcedCombinations } = {};
let lastCacheUpdate = 0;
const CACHE_DURATION = 5000; // 5 seconds

export interface CommonSlice {
  adjustForcedCombinationRarities: () => Promise<RarityConfig>;
  getForcedCombinations: () => Promise<ForcedCombinations>;
  normalizeLayerProbabilities: (layer: string) => Promise<void>;
  clearForcedCombinationsCache: () => void;
}

const normalizeLayer = (layer: string, currentSetId: string): E.Effect<void, Error, never> => {
  return pipe(
    E.succeed(useLayerOrderStore.getState()),
    E.flatMap((store) =>
      E.tryPromise({
        try: async () => {
          await new Promise<void>((resolve) => {
            store.updateRarityConfig<RarityConfig>((config: RarityConfig): RarityConfig => {
              const layerConfig = config?.[layer];
              if (!layerConfig?.traits) {
                return config;
              }

              const normalizedTraits = normalizeLayerTraits(layerConfig.traits, currentSetId);

              return {
                ...config,
                [layer]: {
                  ...layerConfig,
                  traits: normalizedTraits,
                },
              };
            });
            resolve();
          });
        },
        catch: (error) => new Error(`Failed to normalize layer ${layer}: ${String(error)}`),
      })
    )
  );
};

export const createCommonSlice: StateCreator<CommonSlice, [], [], CommonSlice> = () => ({
  adjustForcedCombinationRarities: async () => {
    return pipe(
      E.Do,
      E.bind('currentSetId', () => E.succeed(getCurrentSetId())),
      E.bind('forcedCombinations', ({ currentSetId }) => {
        const now = Date.now();

        if (forcedCombinationsCache[currentSetId] && now - lastCacheUpdate < CACHE_DURATION) {
          return E.succeed(forcedCombinationsCache[currentSetId]);
        }

        return pipe(
          loadForcedCombinations(currentSetId),
          E.tap((data) =>
            E.sync(() => {
              forcedCombinationsCache[currentSetId] = data;
              lastCacheUpdate = now;
            })
          )
        );
      }),
      E.bind('config', () => E.succeed(useLayerOrderStore.getState().rarityConfig || {})),
      E.flatMap(({ currentSetId, forcedCombinations, config }) => {
        const { updatedConfig, hasChanges } = applyForcedCombinationAdjustments(
          config,
          forcedCombinations,
          currentSetId
        );

        if (!hasChanges) {
          return E.succeed(updatedConfig);
        }

        return pipe(
          Object.keys(updatedConfig),
          A.map((layer) => normalizeLayer(layer, currentSetId)),
          E.all,
          E.map(() => updatedConfig)
        );
      }),
      E.catchAll((error) => {
        console.error('Error adjusting forced combination rarities:', error);
        return E.succeed(useLayerOrderStore.getState().rarityConfig || {});
      }),
      E.runPromise
    );
  },

  getForcedCombinations: async () => {
    return await pipe(
      E.succeed(getCurrentSetId()),
      E.flatMap((currentSetId) => {
        const now = Date.now();

        if (forcedCombinationsCache[currentSetId] && now - lastCacheUpdate < CACHE_DURATION) {
          return E.succeed(forcedCombinationsCache[currentSetId]);
        }

        return pipe(
          loadForcedCombinations(currentSetId),
          E.tap((data) =>
            E.sync(() => {
              forcedCombinationsCache[currentSetId] = data;
              lastCacheUpdate = now;
            })
          )
        );
      }),
      E.catchAll((error) => {
        console.error('Error getting forced combinations:', error);
        return E.succeed({} as ForcedCombinations);
      }),
      E.runPromise
    );
  },

  normalizeLayerProbabilities: async (layer: string) => {
    await pipe(
      E.succeed(getCurrentSetId()),
      E.flatMap((currentSetId) => normalizeLayer(layer, currentSetId)),
      E.catchAll((error) => {
        console.error('Error normalizing layer probabilities:', error);
        return E.succeed(undefined);
      }),
      E.runPromise
    );
  },

  clearForcedCombinationsCache: () => {
    forcedCombinationsCache = {};
    lastCacheUpdate = 0;
  },
});
