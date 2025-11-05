import { StateCreator } from 'zustand';
import * as E from 'effect/Effect';
import { pipe } from 'effect/Function';

import type { RarityConfig, LayerConfig, ForcedCombinations } from '@/types/effect';

import {
  getCurrentSetId,
  ensureTraitConfigRecord,
  initializeNoneTrait,
  checkAllZero,
  areTraitValuesEqual,
  distributeEqualValuesAmongTraits,
  ensureTotalIs100,
  adjustForcedTraitValues,
  ensureStringKey,
  redistributeRemainingRarityToNonForcedTraits,
} from './utils';
import { loadForcedCombinations } from './utils/loadForcedcombinations';
import { CommonSlice, createCommonSlice } from './CommonSlice';
import { useLayerOrderStore } from '@/components/store/layerOrder/main';

export interface SkipToggleSlice extends CommonSlice {
  handleSkipToggle: (layer: string) => Promise<void>;
}

const updateRarityConfig = (
  layer: string,
  currentSetId: string,
  forcedCombinations: ForcedCombinations
): E.Effect<void, Error, never> => {
  return pipe(
    E.succeed(useLayerOrderStore.getState()),
    E.flatMap((store) =>
      E.tryPromise({
        try: async () => {
          await new Promise<void>((resolve) => {
            store.updateRarityConfig<RarityConfig>((config: RarityConfig): RarityConfig => {
              const layerConfig = { ...config?.[layer] } as LayerConfig;
              if (!layerConfig?.traits) {
                return config;
              }

              const safeTraits = ensureTraitConfigRecord(layerConfig.traits);
              initializeNoneTrait(layerConfig, safeTraits, currentSetId);

              const newEnabled = !safeTraits['None']?.sets?.[currentSetId]?.enabled;

              safeTraits['None'].sets[currentSetId] = {
                ...safeTraits['None'].sets[currentSetId],
                enabled: newEnabled,
                blend: safeTraits['None'].sets[currentSetId].blend || {
                  mode: 'source-over',
                  opacity: 1,
                },
              };

              const allZero = checkAllZero(safeTraits, currentSetId);
              if (allZero) {
                return {
                  ...config,
                  [layer]: {
                    ...layerConfig,
                    traits: safeTraits,
                  },
                };
              }

              const nonNoneTraits = Object.entries(safeTraits).filter(
                ([trait, config]) => trait !== 'None' && config.sets[currentSetId]?.enabled
              );

              if (nonNoneTraits.length > 0) {
                const allEqual = areTraitValuesEqual(nonNoneTraits, currentSetId);

                if (allEqual || !newEnabled) {
                  const enabledTraits = Object.entries(safeTraits).filter(
                    ([, config]) => config.sets[currentSetId]?.enabled
                  );

                  if (enabledTraits.length === 0) {
                    return {
                      ...config,
                      [layer]: {
                        ...layerConfig,
                        traits: safeTraits,
                      },
                    };
                  }

                  distributeEqualValuesAmongTraits(safeTraits, enabledTraits, currentSetId);
                } else if (
                  newEnabled &&
                  safeTraits['None']?.sets?.[currentSetId] &&
                  !safeTraits['None'].sets[currentSetId].locked
                ) {
                  const enabledTraits = Object.entries(safeTraits).filter(
                    ([, config]) => config.sets[currentSetId]?.enabled
                  );

                  if (enabledTraits.length > 0) {
                    distributeEqualValuesAmongTraits(safeTraits, enabledTraits, currentSetId);
                  }
                }

                const forcedCombosForLayer = forcedCombinations[layer];
                if (forcedCombosForLayer && Object.keys(forcedCombosForLayer).length > 0) {
                  const { totalForcedRarity, forcedTraits } = adjustForcedTraitValues(
                    config,
                    {
                      ...layerConfig,
                      traits: safeTraits,
                    },
                    layer,
                    forcedCombosForLayer as Record<string, Record<string, string[]>>,
                    currentSetId
                  );

                  const remainingRarity = 100 - totalForcedRarity;

                  const nonForcedTraits = Object.entries(safeTraits).filter(
                    ([trait, config]) =>
                      !forcedTraits.has(trait) &&
                      (trait === 'None'
                        ? config.sets[ensureStringKey(currentSetId)]?.enabled
                        : true)
                  );

                  if (nonForcedTraits.length > 0) {
                    redistributeRemainingRarityToNonForcedTraits(
                      safeTraits,
                      nonForcedTraits,
                      remainingRarity,
                      currentSetId
                    );
                  }
                }

                const finalEnabledTraits = Object.entries(safeTraits).filter(
                  ([, config]) => config.sets[ensureStringKey(currentSetId)]?.enabled
                );

                const finalTotal = finalEnabledTraits.reduce(
                  (sum, [, config]) => sum + config.sets[ensureStringKey(currentSetId)].value,
                  0
                );

                if (Math.abs(finalTotal - 100) > 0.1) {
                  ensureTotalIs100(safeTraits, finalEnabledTraits, currentSetId);
                }
              }

              return {
                ...config,
                [layer]: {
                  ...layerConfig,
                  traits: safeTraits,
                },
              };
            });
            resolve();
          });
        },
        catch: (error) => new Error(`Failed to update rarity config: ${String(error)}`),
      })
    )
  );
};

const adjustForcedCombinationRarities = (
  get: () => SkipToggleSlice
): E.Effect<void, Error, never> => {
  return E.tryPromise({
    try: () =>
      new Promise<void>((resolve) => {
        void get().adjustForcedCombinationRarities();
        resolve();
      }),
    catch: (error) => new Error(`Failed to adjust forced combination rarities: ${String(error)}`),
  });
};

export const createSkipToggleSlice: StateCreator<SkipToggleSlice, [], [], SkipToggleSlice> = (
  set,
  get,
  store
) => ({
  ...createCommonSlice(set, get, store),
  handleSkipToggle: async (layer: string): Promise<void> => {
    await pipe(
      E.Do,
      E.bind('currentSetId', () => E.succeed(getCurrentSetId())),
      E.bind('forcedCombinations', ({ currentSetId }) => loadForcedCombinations(currentSetId)),
      E.flatMap(({ currentSetId, forcedCombinations }) =>
        pipe(
          updateRarityConfig(layer, currentSetId, forcedCombinations),
          E.flatMap(() => adjustForcedCombinationRarities(get))
        )
      ),
      E.catchAll((error) => {
        console.error('Error toggling skip:', error);
        return E.void;
      }),
      E.runPromise
    );
  },
});
