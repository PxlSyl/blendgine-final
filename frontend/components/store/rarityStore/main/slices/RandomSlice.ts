import { StateCreator } from 'zustand';
import * as E from 'effect/Effect';
import { pipe } from 'effect/Function';

import type { RarityConfig, TraitConfig, ForcedCombinations } from '@/types/effect';

import {
  getCurrentSetId,
  ensureTraitSetConfig,
  isLayerLocked,
  isTraitLocked,
  isTraitEnabled,
  calculateLockedTotal,
  getUnlockedActiveTraits,
  scaleTraitValues,
  applyRedistributionToLastTrait,
  getLowerLayer,
  getFirstForcedTrait,
  adjustForcedCombination,
  ensureNoneTrait,
  ensureTraitSets,
} from './utils';
import { loadForcedCombinations } from './utils/loadForcedcombinations';
import { CommonSlice, createCommonSlice } from './CommonSlice';
import { useLayerOrderStore } from '@/components/store/layerOrder/main';

export interface RandomSlice extends CommonSlice {
  randomizeLayer: (layer: string) => Promise<void>;
  randomizeAllLayers: () => Promise<void>;
}

const randomizeTraitValue = (
  traits: Record<string, TraitConfig>,
  traitName: string,
  remainingValue: number,
  setId: string
): void => {
  const trait = traits[traitName];
  ensureTraitSets(trait, setId);

  if (traitName === 'None') {
    const shouldEnable = Math.random() < 0.5;
    traits['None'].sets[setId] = {
      ...traits['None'].sets[setId],
      enabled: shouldEnable,
      value: shouldEnable ? Math.random() * remainingValue : 0,
    };
  } else if (!trait.sets[setId].locked && trait.sets[setId].enabled === true) {
    trait.sets[setId].value = Math.random() * remainingValue;
  }
};

const updateLayerRarity = (
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
              const layerConfig = config?.[layer];
              if (!layerConfig || isLayerLocked(layerConfig, currentSetId)) {
                return config;
              }

              const traits: Record<string, TraitConfig> = { ...layerConfig.traits };
              ensureTraitSetConfig(layerConfig, layer, currentSetId);
              ensureNoneTrait(traits, layerConfig, currentSetId);

              const lockedTotal = calculateLockedTotal(traits, currentSetId);
              const remainingValue = 100 - lockedTotal;

              if (!traits['None'].sets[currentSetId].locked) {
                const shouldEnable = Math.random() < 0.5;
                traits['None'].sets[currentSetId] = {
                  ...traits['None'].sets[currentSetId],
                  enabled: shouldEnable,
                  value: shouldEnable ? Math.random() * remainingValue : 0,
                };
              }

              const unlockedActiveTraits = getUnlockedActiveTraits(traits, currentSetId);

              unlockedActiveTraits.forEach(([traitName]) => {
                randomizeTraitValue(traits, traitName, remainingValue, currentSetId);
              });

              const totalRandomValues = unlockedActiveTraits.reduce((sum, [traitName]) => {
                return sum + (traits[traitName].sets[currentSetId]?.value || 0);
              }, 0);

              if (totalRandomValues > 0 && unlockedActiveTraits.length > 0) {
                const scaleFactor = remainingValue / totalRandomValues;
                scaleTraitValues(
                  traits,
                  unlockedActiveTraits.map(([name]) => name),
                  scaleFactor,
                  currentSetId
                );

                const finalTotal = Object.entries(traits)
                  .filter(([, config]) => config.sets?.[currentSetId]?.enabled)
                  .reduce((sum, [, config]) => sum + (config.sets[currentSetId]?.value || 0), 0);

                if (unlockedActiveTraits.length > 0) {
                  applyRedistributionToLastTrait(
                    traits,
                    unlockedActiveTraits.map(([name]) => name),
                    finalTotal,
                    currentSetId
                  );
                }
              }

              if (forcedCombinations[layer]) {
                Object.entries(forcedCombinations[layer]).forEach(([trait, forcedLayers]) => {
                  if (
                    !isTraitLocked(traits[trait], currentSetId) &&
                    isTraitEnabled(traits[trait], currentSetId)
                  ) {
                    Object.entries(forcedLayers as Record<string, unknown>).forEach(
                      ([otherLayer, forcedTraits]) => {
                        const lowerLayer = getLowerLayer(layer, otherLayer);
                        if (layer !== lowerLayer) {
                          const forcedTraitName = getFirstForcedTrait(forcedTraits as string[]);

                          if (
                            !config?.[lowerLayer]?.traits?.[forcedTraitName]?.sets?.[currentSetId]
                          ) {
                            return;
                          }

                          const changed = adjustForcedCombination(
                            config,
                            lowerLayer,
                            forcedTraitName,
                            layer,
                            trait,
                            currentSetId
                          );

                          if (changed && unlockedActiveTraits.length > 1) {
                            const lowerTraitSets =
                              config[lowerLayer]?.traits?.[forcedTraitName]?.sets;
                            const lowerValue = lowerTraitSets?.[currentSetId]?.value || 0;
                            const upperValue = traits[trait].sets[currentSetId].value;
                            const excess = upperValue - lowerValue;

                            const redistributableTraits = unlockedActiveTraits
                              .filter(([t]) => t !== trait)
                              .map(([name]) => name);

                            if (redistributableTraits.length > 0) {
                              const redistributionValue = excess / redistributableTraits.length;
                              redistributableTraits.forEach((t) => {
                                traits[t].sets[currentSetId].value +=
                                  Math.round(redistributionValue * 100) / 100;
                              });

                              applyRedistributionToLastTrait(
                                traits,
                                redistributableTraits,
                                Object.entries(traits)
                                  .filter(([, config]) => config.sets?.[currentSetId]?.enabled)
                                  .reduce(
                                    (sum, [, config]) =>
                                      sum + (config.sets[currentSetId]?.value || 0),
                                    0
                                  ),
                                currentSetId
                              );
                            }
                          }
                        }
                      }
                    );
                  }
                });
              }

              return {
                ...config,
                [layer]: {
                  ...layerConfig,
                  traits,
                },
              };
            });
            resolve();
          });
        },
        catch: (error) => new Error(`Failed to update layer rarity: ${String(error)}`),
      })
    )
  );
};

const adjustForcedCombinationRarities = (get: () => RandomSlice): E.Effect<void, Error, never> => {
  return E.tryPromise({
    try: async () => {
      await get().adjustForcedCombinationRarities();
    },
    catch: (error) => new Error(`Failed to adjust forced combination rarities: ${String(error)}`),
  });
};

export const createRandomSlice: StateCreator<RandomSlice, [], [], RandomSlice> = (
  set,
  get,
  store
) => ({
  ...createCommonSlice(set, get, store),
  randomizeLayer: async (layer: string) => {
    return pipe(
      E.Do,
      E.bind('currentSetId', () => E.succeed(getCurrentSetId())),
      E.bind('forcedCombinations', ({ currentSetId }) => loadForcedCombinations(currentSetId)),
      E.flatMap(({ currentSetId, forcedCombinations }) =>
        updateLayerRarity(layer, currentSetId, forcedCombinations)
      ),
      E.flatMap(() => adjustForcedCombinationRarities(get)),
      E.catchAll((error) => {
        console.error('Error randomizing layer:', error);
        return E.succeed(undefined);
      }),
      E.runPromise
    ).then(() => {});
  },

  randomizeAllLayers: async () => {
    return pipe(
      E.Do,
      E.bind('currentSetId', () => E.succeed(getCurrentSetId())),
      E.bind('forcedCombinations', ({ currentSetId }) => loadForcedCombinations(currentSetId)),
      E.flatMap(({ currentSetId, forcedCombinations }) =>
        pipe(
          E.succeed(useLayerOrderStore.getState()),
          E.flatMap((store) =>
            E.tryPromise({
              try: async () => {
                await new Promise<void>((resolve) => {
                  store.updateRarityConfig<RarityConfig>((config: RarityConfig): RarityConfig => {
                    const newRarityConfig = { ...config };

                    Object.entries(newRarityConfig).forEach(([layer, layerConfig]) => {
                      if (!layerConfig || isLayerLocked(layerConfig, currentSetId)) {
                        return;
                      }

                      const traits = { ...layerConfig.traits };
                      ensureTraitSetConfig(layerConfig, layer, currentSetId);

                      const lockedTotal = calculateLockedTotal(traits, currentSetId);
                      const remainingValue = 100 - lockedTotal;

                      ensureNoneTrait(traits, layerConfig, currentSetId);

                      if (!traits['None'].sets[currentSetId].locked) {
                        const shouldEnable = Math.random() < 0.5;
                        traits['None'].sets[currentSetId] = {
                          ...traits['None'].sets[currentSetId],
                          enabled: shouldEnable,
                          value: shouldEnable ? Math.random() * remainingValue : 0,
                        };
                      }

                      const unlockedActiveTraits = getUnlockedActiveTraits(traits, currentSetId);

                      unlockedActiveTraits.forEach(([traitName]) => {
                        randomizeTraitValue(traits, traitName, remainingValue, currentSetId);
                      });

                      const totalRandomValues = unlockedActiveTraits.reduce((sum, [traitName]) => {
                        return sum + (traits[traitName].sets[currentSetId]?.value || 0);
                      }, 0);

                      if (totalRandomValues > 0 && unlockedActiveTraits.length > 0) {
                        const scaleFactor = remainingValue / totalRandomValues;
                        scaleTraitValues(
                          traits,
                          unlockedActiveTraits.map(([name]) => name),
                          scaleFactor,
                          currentSetId
                        );

                        const finalTotal = Object.entries(traits)
                          .filter(([, config]) => config.sets?.[currentSetId]?.enabled)
                          .reduce(
                            (sum, [, config]) => sum + (config.sets[currentSetId]?.value || 0),
                            0
                          );

                        if (unlockedActiveTraits.length > 0) {
                          applyRedistributionToLastTrait(
                            traits,
                            unlockedActiveTraits.map(([name]) => name),
                            finalTotal,
                            currentSetId
                          );
                        }
                      }

                      if (forcedCombinations[layer]) {
                        Object.entries(forcedCombinations[layer]).forEach(
                          ([trait, forcedLayers]) => {
                            if (
                              !isTraitLocked(traits[trait], currentSetId) &&
                              isTraitEnabled(traits[trait], currentSetId)
                            ) {
                              Object.entries(forcedLayers as Record<string, unknown>).forEach(
                                ([otherLayer, forcedTraits]) => {
                                  const lowerLayer = getLowerLayer(layer, otherLayer);
                                  if (layer !== lowerLayer) {
                                    const forcedTraitName = getFirstForcedTrait(
                                      forcedTraits as string[]
                                    );

                                    if (
                                      !config?.[lowerLayer]?.traits?.[forcedTraitName]?.sets?.[
                                        currentSetId
                                      ]
                                    ) {
                                      return;
                                    }

                                    const changed = adjustForcedCombination(
                                      config,
                                      lowerLayer,
                                      forcedTraitName,
                                      layer,
                                      trait,
                                      currentSetId
                                    );

                                    if (changed && unlockedActiveTraits.length > 1) {
                                      const lowerTraitSets =
                                        config[lowerLayer]?.traits?.[forcedTraitName]?.sets;
                                      const lowerValue = lowerTraitSets?.[currentSetId]?.value || 0;
                                      const upperValue = traits[trait].sets[currentSetId].value;
                                      const excess = upperValue - lowerValue;

                                      const redistributableTraits = unlockedActiveTraits
                                        .filter(([t]) => t !== trait)
                                        .map(([name]) => name);

                                      if (redistributableTraits.length > 0) {
                                        const redistributionValue =
                                          excess / redistributableTraits.length;
                                        redistributableTraits.forEach((t) => {
                                          traits[t].sets[currentSetId].value +=
                                            Math.round(redistributionValue * 100) / 100;
                                        });

                                        applyRedistributionToLastTrait(
                                          traits,
                                          redistributableTraits,
                                          Object.entries(traits)
                                            .filter(
                                              ([, config]) => config.sets?.[currentSetId]?.enabled
                                            )
                                            .reduce(
                                              (sum, [, config]) =>
                                                sum + (config.sets[currentSetId]?.value || 0),
                                              0
                                            ),
                                          currentSetId
                                        );
                                      }
                                    }
                                  }
                                }
                              );
                            }
                          }
                        );
                      }

                      newRarityConfig[layer] = {
                        ...layerConfig,
                        traits,
                      };
                    });

                    return newRarityConfig;
                  });
                  resolve();
                });
              },
              catch: (error) => new Error(`Failed to update all layers: ${String(error)}`),
            })
          )
        )
      ),
      E.flatMap(() => adjustForcedCombinationRarities(get)),
      E.catchAll((error) => {
        console.error('Error randomizing all layers:', error);
        return E.succeed(undefined);
      }),
      E.runPromise
    ).then(() => {});
  },
});
