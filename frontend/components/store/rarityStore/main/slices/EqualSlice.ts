import { StateCreator } from 'zustand';
import * as E from 'effect/Effect';
import { pipe } from 'effect/Function';

import type { RarityConfig, ForcedCombinationsBySets } from '@/types/effect';

import {
  getCurrentSetId,
  ensureTraitSetConfig,
  isLayerLocked,
  isTraitLocked,
  isTraitEnabled,
  distributeEquallyAmongTraits,
  calculateLockedTotal,
  getUnlockedActiveTraits,
  processForcedCombinations,
  applyForcedCombinationAdjustments,
} from './utils';

import { loadForcedCombinations } from './utils/loadForcedcombinations';
import { CommonSlice, createCommonSlice } from './CommonSlice';
import { useLayerOrderStore } from '@/components/store/layerOrder/main';

export interface EqualSlice extends CommonSlice {
  equalizeRarity: (layer: string) => Promise<void>;
  equalizeAllLayers: () => Promise<void>;
}

const updateLayerRarity = (
  layer: string,
  currentSetId: string,
  forcedCombosForLayer: Record<string, Record<string, string[]>> | undefined
): E.Effect<void, Error, never> => {
  return pipe(
    E.succeed(useLayerOrderStore.getState()),
    E.flatMap((store) =>
      E.tryPromise({
        try: async () => {
          await new Promise<void>((resolve) => {
            store.updateRarityConfig<RarityConfig>((config: RarityConfig): RarityConfig => {
              const layerConfig = config?.[layer];
              if (!layerConfig?.traits || isLayerLocked(layerConfig, currentSetId)) {
                return config;
              }

              const enabledTraits = Object.entries(layerConfig.traits).filter(
                ([, traitConfig]) =>
                  !isTraitLocked(traitConfig, currentSetId) &&
                  isTraitEnabled(traitConfig, currentSetId)
              );

              if (enabledTraits.length === 0) {
                return config;
              }

              const lockedTotal = calculateLockedTotal(layerConfig.traits, currentSetId);
              const availablePercentage = 100 - lockedTotal;

              const newTraits = { ...layerConfig.traits };
              ensureTraitSetConfig(layerConfig, 'None', currentSetId);

              distributeEquallyAmongTraits(
                newTraits,
                enabledTraits,
                availablePercentage,
                currentSetId
              );

              if (forcedCombosForLayer && Object.keys(forcedCombosForLayer).length > 0) {
                const tempConfig = {
                  ...config,
                  [layer]: {
                    ...layerConfig,
                    traits: newTraits,
                  },
                };

                const layerForcedCombos = {
                  [layer]: forcedCombosForLayer,
                } as ForcedCombinationsBySets;

                const processedConfig = processForcedCombinations(
                  tempConfig as RarityConfig,
                  layerForcedCombos,
                  currentSetId
                );

                return {
                  ...config,
                  [layer]: processedConfig?.[layer],
                };
              }

              return {
                ...config,
                [layer]: {
                  ...layerConfig,
                  traits: newTraits,
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

const applyForcedCombinationUpdates = (
  currentSetId: string,
  forcedCombinations: ForcedCombinationsBySets
): E.Effect<void, Error, never> => {
  return pipe(
    E.succeed(useLayerOrderStore.getState()),
    E.flatMap((store) =>
      E.try({
        try: () => {
          const { updatedConfig } = applyForcedCombinationAdjustments(
            store.rarityConfig,
            forcedCombinations,
            currentSetId
          );

          if (updatedConfig) {
            store.setRarityConfig(updatedConfig);
          }
        },
        catch: (error) => new Error(`Failed to apply forced combination updates: ${String(error)}`),
      })
    )
  );
};

export const createEqualSlice: StateCreator<EqualSlice, [], [], EqualSlice> = (
  set,
  get,
  store
) => ({
  ...createCommonSlice(set, get, store),
  equalizeRarity: async (layer: string) => {
    return pipe(
      E.Do,
      E.bind('currentSetId', () => E.succeed(getCurrentSetId())),
      E.bind('forcedCombinations', ({ currentSetId }) => loadForcedCombinations(currentSetId)),
      E.flatMap(({ currentSetId, forcedCombinations }) =>
        pipe(
          updateLayerRarity(
            layer,
            currentSetId,
            forcedCombinations[layer] as Record<string, Record<string, string[]>> | undefined
          ),
          E.flatMap(() => applyForcedCombinationUpdates(currentSetId, forcedCombinations))
        )
      ),
      E.catchAll((error) => {
        console.error('Error equalizing rarity:', error);
        return E.succeed(undefined);
      }),
      E.runPromise
    );
  },

  equalizeAllLayers: async () => {
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
                    let newRarityConfig = { ...config };

                    Object.entries(newRarityConfig).forEach(([, layerConfig]) => {
                      if (!layerConfig?.traits || isLayerLocked(layerConfig, currentSetId)) {
                        return;
                      }

                      const safeTraits = { ...layerConfig.traits };
                      ensureTraitSetConfig(layerConfig, 'None', currentSetId);
                      const enabledTraits = getUnlockedActiveTraits(safeTraits, currentSetId);

                      if (enabledTraits.length === 0) {
                        return;
                      }

                      const lockedTotal = calculateLockedTotal(safeTraits, currentSetId);
                      const availablePercentage = 100 - lockedTotal;

                      distributeEquallyAmongTraits(
                        safeTraits,
                        enabledTraits,
                        availablePercentage,
                        currentSetId
                      );

                      if (layerConfig) {
                        layerConfig.traits = safeTraits;
                      }
                    });

                    if (Object.keys(forcedCombinations).length > 0) {
                      newRarityConfig = processForcedCombinations(
                        newRarityConfig,
                        forcedCombinations,
                        currentSetId
                      );
                    }

                    return newRarityConfig;
                  });
                  resolve();
                });
              },
              catch: (error) => new Error(`Failed to update all layers: ${String(error)}`),
            })
          ),
          E.flatMap(() => applyForcedCombinationUpdates(currentSetId, forcedCombinations))
        )
      ),
      E.catchAll((error) => {
        console.error('Error equalizing all layers:', error);
        return E.succeed(undefined);
      }),
      E.runPromise
    );
  },
});
