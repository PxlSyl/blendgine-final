import { StateCreator } from 'zustand';
import { Effect, pipe } from 'effect';

import { api } from '@/services';

import type { LayerOrderState, LayerOrderActions } from '../types';
import type { RarityConfig, SetInfo } from '@/types/effect';

import {
  ensureMutableSets,
  processLoadedPersistedState,
  updatePossibleCombinations,
} from './utils';
import { useGlobalRarityStore } from '@/components/store/rarityStore/globalRarityStore';
import { safeValidate } from '@/utils/effect/effectValidation';
import { RarityConfigSchema } from '@/schemas/effect';

type LoadedData = {
  sets?: Record<string, SetInfo>;
  activeSetId?: string | null;
  expandedLayers?: Record<string, Record<string, boolean>>;
  forcedTraits?: Record<string, Record<string, string>>;
};

export interface SaveLoadSlice {
  saveState: () => Promise<void>;
  prepareStateForSave: (state: LayerOrderState) => LayerOrderState;
  saveRarityConfig: () => Promise<void>;
  loadRarityConfig: () => Promise<void>;
  setRarityConfig: (config: RarityConfig) => void;
  updateRarityConfig: <T extends RarityConfig>(updater: (config: T) => T) => void;
  loadPersistedState: () => Promise<void>;
}

export const createSaveLoadSlice: StateCreator<
  LayerOrderState & LayerOrderActions,
  [],
  [],
  SaveLoadSlice
> = (set, get) => {
  let saveTimeout: NodeJS.Timeout | undefined;
  let saveRarityTimeout: NodeJS.Timeout | undefined;

  const prepareStateForSave = (state: LayerOrderState): LayerOrderState => {
    return pipe(
      Effect.succeed(state.sets ?? {}),
      Effect.map((sets) =>
        Object.fromEntries(
          Object.entries(sets).map(([id, setInfo]) => [
            id,
            {
              ...setInfo,
              customName: setInfo.customName ?? setInfo.name ?? id,
              layers: Array.isArray(setInfo.layers) ? [...setInfo.layers] : [],
            },
          ])
        )
      ),
      Effect.map((freshSets) => ({
        ...state,
        sets: freshSets,
      })),
      Effect.runSync
    );
  };

  return {
    saveState: async () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }

      return new Promise<void>((resolve) => {
        saveTimeout = setTimeout(() => {
          void (async () => {
            try {
              await pipe(
                Effect.succeed(get()),
                Effect.map(prepareStateForSave),
                Effect.flatMap((stateToSave) =>
                  stateToSave
                    ? Effect.promise(() =>
                        api.saveLayerOrderState({
                          sets: ensureMutableSets(stateToSave.sets ?? {}),
                          activeSetId: stateToSave.activeSetId ?? 'set1',
                          setOrders: stateToSave.setOrders ?? [],
                        })
                      )
                    : Effect.fail(new Error('No state to save'))
                ),
                Effect.catchAll((error) => {
                  console.error('Error saving state:', error);
                  return Effect.succeed(undefined);
                }),
                Effect.runPromise
              );
              resolve();
            } catch (error) {
              console.error('Error in debounced save:', error);
              resolve();
            }
          })();
        }, 500);
      });
    },

    prepareStateForSave,

    saveRarityConfig: async () => {
      if (saveRarityTimeout) {
        clearTimeout(saveRarityTimeout);
      }

      return new Promise<void>((resolve) => {
        saveRarityTimeout = setTimeout(() => {
          void (async () => {
            try {
              await pipe(
                Effect.succeed(get().rarityConfig),
                Effect.flatMap((config) =>
                  config
                    ? Effect.promise(() => api.saveRarityConfig(config))
                    : Effect.fail(new Error('No rarity config to save'))
                ),
                Effect.flatMap(() =>
                  Effect.promise(() => {
                    const { updateGlobalRarityFromConfig } = useGlobalRarityStore.getState();
                    return updateGlobalRarityFromConfig();
                  })
                ),
                Effect.catchAll((error) => {
                  console.error('Error saving rarity config:', error);
                  return Effect.succeed(undefined);
                }),
                Effect.runPromise
              );
              resolve();
            } catch (error) {
              console.error('Error in debounced rarity save:', error);
              resolve();
            }
          })();
        }, 300);
      });
    },

    loadRarityConfig: async () => {
      return pipe(
        Effect.promise(() => api.loadLayerOrderState()),
        Effect.flatMap((data) =>
          Effect.promise(() => api.loadRarityConfig()).pipe(
            Effect.map((rarityData) => ({ data, rarityData }))
          )
        ),
        Effect.flatMap(({ data, rarityData }) => {
          if (!data || !rarityData) {
            return Effect.fail(new Error('[loadRarityConfig] La configuration chargée est vide'));
          }

          const processedData = {
            sets: data.sets ?? {},
            activeSetId: data.activeSetId ?? undefined,
            expandedLayers: (data as LoadedData).expandedLayers ?? {},
            forcedTraits: (data as LoadedData).forcedTraits ?? {},
          };

          const processedState = processLoadedPersistedState(processedData);
          const {
            sets,
            activeSetId: processedActiveSetId,
            expandedLayers,
            forcedTraits,
          } = processedState;

          const processedSets = ensureMutableSets(sets ?? {});

          return Effect.succeed({
            processedSets,
            processedActiveSetId,
            expandedLayers,
            forcedTraits,
            rarityData,
          });
        }),
        Effect.flatMap(
          ({ processedSets, processedActiveSetId, expandedLayers, forcedTraits, rarityData }) =>
            Effect.sync(() => {
              set((state) => ({
                ...state,
                sets: processedSets,
                activeSetId: processedActiveSetId ?? 'set1',
                rarityConfig: rarityData ?? state.rarityConfig,
                expandedLayers: expandedLayers ?? {},
                forcedTraits: forcedTraits ?? {},
              }));
            })
        ),
        Effect.flatMap(() =>
          Effect.promise(() => {
            const store = { set, get };
            return updatePossibleCombinations(store, 'loadRarityConfig');
          })
        ),
        Effect.catchAll((error) => {
          console.error('[loadRarityConfig] Failed to load rarity configuration:', error);
          return Effect.succeed(undefined);
        }),
        Effect.map(() => undefined),
        Effect.runPromise
      );
    },

    setRarityConfig: (config: RarityConfig) => {
      const validation = safeValidate(RarityConfigSchema, config);
      if (!validation.success) {
        console.error('Validation failed:', validation.errors);
        return;
      }
      set({ rarityConfig: config });
    },

    updateRarityConfig: <T extends RarityConfig>(updater: (config: T) => T) => {
      void pipe(
        Effect.succeed(get().rarityConfig as T),
        Effect.map(updater),
        Effect.flatMap((newConfig) => {
          const validationResult = safeValidate(RarityConfigSchema, newConfig);
          if (!validationResult.success) {
            return Effect.fail(
              new Error(
                `Invalid rarity configuration after update: ${JSON.stringify(validationResult.errors)}`
              )
            );
          }
          return Effect.succeed(newConfig);
        }),
        Effect.flatMap((newConfig) =>
          Effect.sync(() => {
            set({ rarityConfig: newConfig });
            return newConfig;
          })
        ),
        Effect.flatMap(() =>
          Effect.promise(() => {
            void get().saveRarityConfig();
            const store = { set, get };
            return updatePossibleCombinations(store, 'updateRarityConfig');
          })
        ),
        Effect.flatMap(() =>
          Effect.promise(() => {
            const { updateGlobalRarityFromConfig } = useGlobalRarityStore.getState();
            return updateGlobalRarityFromConfig();
          })
        ),
        Effect.catchAll((error) => {
          console.error('Error updating rarity config:', error);
          return Effect.succeed(undefined);
        }),
        Effect.map(() => undefined),
        Effect.runPromise
      );
    },

    loadPersistedState: async () => {
      return pipe(
        Effect.promise(() => api.loadLayerOrderState()),
        Effect.flatMap((data) => {
          if (!data) {
            return Effect.fail(new Error('No data to load'));
          }
          return Effect.promise(() => api.loadRarityConfig()).pipe(
            Effect.map((rarityData) => ({ data, rarityData }))
          );
        }),
        Effect.flatMap(({ data, rarityData }) => {
          const processedData = {
            sets: data.sets ?? {},
            activeSetId: data.activeSetId ?? undefined,
            setOrders: data.setOrders ?? [],
          };
          const processedState = processLoadedPersistedState(processedData);
          const { sets, activeSetId, expandedLayers, forcedTraits } = processedState;
          const processedSets = ensureMutableSets(sets ?? {});

          const setOrders =
            processedData.setOrders.length > 0
              ? processedData.setOrders
              : Object.keys(processedSets).map((id, index) => ({
                  id,
                  order: index,
                }));

          return Effect.succeed({
            processedSets,
            activeSetId,
            expandedLayers,
            forcedTraits,
            rarityData,
            setOrders,
          });
        }),
        Effect.flatMap(
          ({ processedSets, activeSetId, expandedLayers, forcedTraits, rarityData, setOrders }) =>
            Effect.sync(() => {
              set((state) => ({
                ...state,
                sets: processedSets,
                activeSetId: activeSetId ?? 'set1',
                rarityConfig: rarityData ?? state.rarityConfig,
                expandedLayers: expandedLayers ?? {},
                forcedTraits: forcedTraits ?? {},
                setOrders,
              }));
            })
        ),
        Effect.flatMap(() =>
          Effect.promise(() => {
            const store = { set, get };
            return updatePossibleCombinations(store, 'loadPersistedState');
          })
        ),
        Effect.catchAll((error) => {
          console.error('[loadPersistedState] Failed to load persisted state:', error);
          return Effect.succeed(undefined);
        }),
        Effect.map(() => undefined),
        Effect.runPromise
      );
    },
  };
};
