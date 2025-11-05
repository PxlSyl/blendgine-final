import { create } from 'zustand';
import { pipe } from 'effect/Function';
import * as E from 'effect/Effect';

import { api } from '@/services';

import type { GlobalRarityActions, GlobalRarityData, GlobalRarityState } from './types';

import {
  GlobalRarityStateSchema,
  createDefaultGlobalRarityState,
} from '@/schemas/effect/rarityStore/globalRarityStore';
import { safeValidate } from '@/utils/effect/effectValidation';
import { effectUpdate } from '@/utils/effect/effectUpdater';

import { useLayerOrderStore } from '@/components/store/layerOrder/main';

export const useGlobalRarityStore = create<GlobalRarityState & GlobalRarityActions>()((
  set,
  get
) => {
  const defaultState = createDefaultGlobalRarityState();
  let isInitialized = false;

  const loadPersistedData = async () => {
    const effect = pipe(
      E.Do,
      E.bind('loadResult', () => {
        return E.tryPromise(() => api.loadGlobalRarity()).pipe(
          E.catchAll((error) => {
            console.error('Failed to load persisted global rarity data:', error);
            return E.succeed({ success: false, data: undefined });
          })
        );
      }),
      E.map(({ loadResult }) => {
        if (loadResult.success && loadResult.data) {
          const validatedData: Record<string, GlobalRarityData[]> = {};

          Object.entries(loadResult.data).forEach(([layer, traitsArray]) => {
            if (Array.isArray(traitsArray)) {
              validatedData[layer] = traitsArray.map((trait: unknown) => {
                if (
                  typeof trait === 'object' &&
                  trait !== null &&
                  'traitName' in trait &&
                  'rarity' in trait
                ) {
                  return {
                    traitName: String(trait.traitName),
                    rarity: typeof trait.rarity === 'number' ? trait.rarity : 0,
                  };
                }
                return { traitName: '', rarity: 0 };
              });
            }
          });

          set((state) => ({
            ...state,
            persistedRarityData: validatedData,
          }));
        }
        isInitialized = true;

        return undefined;
      })
    );

    await E.runPromise(effect);
  };

  void loadPersistedData();

  return {
    ...defaultState,

    setGlobalViewActive: (isActive: boolean): E.Effect<void, Error, never> => {
      const currentState = get();
      const newState = {
        isGlobalViewActive: isActive,
        lastActiveSet: currentState.lastActiveSet,
        persistedRarityData: currentState.persistedRarityData,
      };
      const validationResult = safeValidate(GlobalRarityStateSchema, newState);

      if (!validationResult.success) {
        console.warn('Invalid state update in setGlobalViewActive:', validationResult.errors);
        return E.fail(new Error(`Invalid state: ${validationResult.errors?.join(', ')}`));
      }

      effectUpdate(get, set, (state) => ({
        ...state,
        isGlobalViewActive: isActive,
      }));

      return E.succeed(void 0);
    },

    toggleGlobalView: (): E.Effect<void, Error, never> => {
      const currentState = get().isGlobalViewActive;
      const layerOrderStore = useLayerOrderStore.getState();
      const state = get();

      if (!currentState) {
        const newState = {
          isGlobalViewActive: true,
          lastActiveSet: layerOrderStore.activeSetId ?? 'set1',
          persistedRarityData: state.persistedRarityData,
        };

        const validationResult = safeValidate(GlobalRarityStateSchema, newState);
        if (!validationResult.success) {
          console.warn('Invalid state update in toggleGlobalView:', validationResult.errors);
          return E.fail(new Error(`Invalid state: ${validationResult.errors?.join(', ')}`));
        }

        effectUpdate(get, set, (state) => ({
          ...state,
          isGlobalViewActive: true,
          lastActiveSet: layerOrderStore.activeSetId ?? 'set1',
        }));
      } else {
        const { lastActiveSet } = get();

        effectUpdate(get, set, (state) => ({
          ...state,
          isGlobalViewActive: false,
        }));

        if (lastActiveSet) {
          const setNumberMatch = lastActiveSet.match(/set(\d+)/);
          if (setNumberMatch?.[1]) {
            const setNumber = parseInt(setNumberMatch[1], 10);
            layerOrderStore.setActiveSet(setNumber);
          }
        }
      }

      return E.succeed(void 0);
    },

    getGlobalRarityData: (layer: string): GlobalRarityData[] => {
      const { persistedRarityData } = get();

      if (!isInitialized || !persistedRarityData?.[layer]) {
        return [];
      }

      return persistedRarityData[layer];
    },

    updateGlobalRarityFromConfig: async (): Promise<void> => {
      const effect = pipe(
        E.Do,
        E.bind('config', () => E.succeed(useLayerOrderStore.getState())),
        E.bind('updateResult', ({ config }) =>
          E.tryPromise(() =>
            api.updateGlobalRarityFromConfig({
              rarityConfig: config.rarityConfig,
              sets: config.sets,
            })
          ).pipe(
            E.catchAll((error) => {
              console.error('Failed to update global rarity from config:', error);
              return E.succeed({ success: false, error: 'Update failed' });
            })
          )
        ),
        E.bind('loadResult', ({ updateResult }) =>
          updateResult?.success
            ? E.tryPromise(() => {
                return new Promise((resolve) =>
                  setTimeout(() => resolve(api.loadGlobalRarity()), 100)
                );
              }).pipe(
                E.catchAll((error) => {
                  console.error('Failed to load global rarity data:', error);
                  return E.succeed({ success: false, data: undefined });
                })
              )
            : E.succeed({ success: false, data: undefined })
        ),
        E.map(({ loadResult }) => {
          if (
            loadResult &&
            typeof loadResult === 'object' &&
            'success' in loadResult &&
            loadResult.success &&
            'data' in loadResult &&
            loadResult.data
          ) {
            const validatedData: Record<string, GlobalRarityData[]> = {};

            Object.entries(loadResult.data).forEach(([layer, traitsArray]) => {
              if (Array.isArray(traitsArray)) {
                validatedData[layer] = traitsArray.map((trait: unknown) => {
                  if (
                    typeof trait === 'object' &&
                    trait !== null &&
                    'traitName' in trait &&
                    'rarity' in trait
                  ) {
                    return {
                      traitName: String(trait.traitName),
                      rarity: typeof trait.rarity === 'number' ? trait.rarity : 0,
                    };
                  }
                  return { traitName: '', rarity: 0 };
                });
              }
            });

            set((state) => ({
              ...state,
              persistedRarityData: validatedData,
            }));
          }

          return undefined;
        })
      );

      await E.runPromise(effect);
    },

    refreshGlobalRarityData: async (): Promise<void> => {
      const effect = pipe(
        E.Do,
        E.bind('loadResult', () =>
          E.tryPromise(() => api.loadGlobalRarity()).pipe(
            E.catchAll((error) => {
              console.error('Failed to load global rarity data:', error);
              return E.succeed({ success: false, data: undefined });
            })
          )
        ),
        E.map(({ loadResult }) => {
          if (
            loadResult &&
            typeof loadResult === 'object' &&
            'success' in loadResult &&
            loadResult.success &&
            'data' in loadResult &&
            loadResult.data
          ) {
            const validatedData: Record<string, GlobalRarityData[]> = {};

            Object.entries(loadResult.data).forEach(([layer, traitsArray]) => {
              if (Array.isArray(traitsArray)) {
                validatedData[layer] = traitsArray.map((trait: unknown) => {
                  if (
                    typeof trait === 'object' &&
                    trait !== null &&
                    'traitName' in trait &&
                    'rarity' in trait
                  ) {
                    return {
                      traitName: String(trait.traitName),
                      rarity: typeof trait.rarity === 'number' ? trait.rarity : 0,
                    };
                  }
                  return { traitName: '', rarity: 0 };
                });
              }
            });

            set((state) => ({
              ...state,
              persistedRarityData: validatedData,
            }));
          }

          return undefined;
        })
      );

      await E.runPromise(effect);
    },
  };
});
