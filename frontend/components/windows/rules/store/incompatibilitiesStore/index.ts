import { create } from 'zustand';
import * as E from 'effect/Effect';
import * as S from '@effect/schema/Schema';
import { pipe } from 'effect/Function';

import { api } from '@/services';

import type { IncompatibilityActions, InternalIncompatibilityState } from './types';
import {
  IncompatibilitySelectorType,
  IncompatibilityState,
  RarityConfig,
  IncompatibilitySide,
  IncompatibilitiesBySets,
} from '@/types/effect';

import { isLayerTraitValid as isLayerTraitValidUtil } from '../utils/rulesValidationUtils';

import { IncompatibilityStateSchema } from '@/schemas/effect/rulesStore';
import { IncompatibilitiesSchema } from '@/schemas/effect/layerOrder';

import {
  addIncompatibility as addIncompatibilityUtil,
  removeIncompatibility as removeIncompatibilityUtil,
  resetIfInvalid as resetIfInvalidUtil,
  cleanupIncompatibilities as cleanupIncompatibilitiesUtil,
  getActiveSetIncompatibilitiesMemoized,
  initializeSet as initializeSetUtil,
} from '../utils/incompatibilityStoreUtils';

import { EffectOrPromise } from '@/utils/effect/effectPromiseUtils';

const initialState: InternalIncompatibilityState = {
  incompatibilitiesBySets: { set1: {} } as IncompatibilitiesBySets,
  incompatibilitySelectors: [
    { id: 0, firstCategory: '', firstItem: '', secondCategory: '', secondItem: '' },
  ],
  activeSet: 'set1',
  availableSets: [1],
  _dataInitialized: false,
};

export const useIncompatibilitiesStore = create<
  InternalIncompatibilityState & IncompatibilityActions
>((set, get) => {
  const apiSaveState = (): E.Effect<void, Error, never> => {
    return E.tryPromise({
      try: async () => {
        const state = get();
        const { incompatibilitiesBySets } = state;

        try {
          S.decodeSync(IncompatibilitiesSchema)(incompatibilitiesBySets);
        } catch (error) {
          console.warn('Invalid state before saving:', error);
        }

        await api.saveIncompatibilityState(incompatibilitiesBySets);
      },
      catch: (error) => new Error(`Failed to save incompatibility state: ${String(error)}`),
    });
  };

  const loadPersistedState = async () => {
    return E.runPromise(
      pipe(
        E.tryPromise(() => api.loadIncompatibilityState()),
        E.flatMap((storedData) => {
          if (!storedData) {
            return E.succeed(initialState);
          }

          return pipe(
            E.try({
              try: () => {
                if (typeof storedData !== 'object' || storedData === null) {
                  throw new Error('Invalid stored data format');
                }

                const normalizedData: IncompatibilityState = {
                  incompatibilitiesBySets: storedData as unknown as IncompatibilitiesBySets,
                  incompatibilitySelectors: [
                    { id: 0, firstCategory: '', firstItem: '', secondCategory: '', secondItem: '' },
                  ],
                  activeSet: get().activeSet || 'set1',
                  availableSets: get().availableSets || [1],
                };

                return S.decodeSync(IncompatibilityStateSchema)(normalizedData);
              },
              catch: (error) => {
                console.warn('Invalid stored data, using initial state:', error);
                return initialState;
              },
            })
          );
        }),
        E.tap((finalData) =>
          E.sync(() =>
            set({
              ...finalData,
              _dataInitialized: true,
            })
          )
        ),
        E.map(() => undefined)
      )
    ) as Promise<void>;
  };

  return {
    ...initialState,

    initializeData: async () => {
      if (get()._dataInitialized) {
        return E.runPromise(E.void);
      }

      return E.runPromise(
        pipe(
          E.sync(() => get().loadPersistedState()),
          E.catchAll((error) => {
            console.error('IncompatibilitiesStore: Error during data initialization:', error);
            return E.void;
          })
        )
      ) as Promise<void>;
    },

    setActiveSet: (setNumber: number): EffectOrPromise<void> => {
      return E.sync(() => {
        const setId = `set${setNumber}`;
        set((state) => ({
          ...state,
          activeSet: setId,
        }));
      });
    },

    setAvailableSets: (sets: number[]): EffectOrPromise<void> => {
      return E.sync(() => {
        set((state) => ({
          ...state,
          availableSets: sets,
        }));
      });
    },

    updateState: (state: Partial<IncompatibilityState>): EffectOrPromise<void> => {
      return pipe(
        E.try({
          try: () => {
            const partialSchema = S.partial(IncompatibilityStateSchema);
            return S.decodeSync(partialSchema)(state);
          },
          catch: (error) => new Error(`Invalid state: ${String(error)}`),
        }),
        E.tap((validState) =>
          E.sync(() => {
            set((currentState) => ({
              ...currentState,
              ...validState,
            }));
          })
        ),
        E.map(() => void 0)
      );
    },

    resetStore: (): EffectOrPromise<void> => {
      return pipe(
        E.sync(() => {
          set(() => ({
            ...initialState,
          }));
        }),
        E.flatMap(() => apiSaveState())
      );
    },

    resetIncompatibilityStore: (): EffectOrPromise<void> => {
      return get().resetStore();
    },

    resetIncompatibilityStateForActiveSet: (): EffectOrPromise<void> => {
      const { activeSet } = get();

      return pipe(
        E.sync(() => {
          set((state) => ({
            ...state,
            incompatibilitiesBySets: {
              ...state.incompatibilitiesBySets,
              [activeSet]: {},
            },
          }));
        }),
        E.flatMap(() => apiSaveState())
      );
    },

    resetIncompatibilitiesStore: (): EffectOrPromise<void> => {
      return pipe(
        E.sync(() => {
          set(() => ({
            ...initialState,
          }));
        }),
        E.flatMap(() => apiSaveState())
      );
    },

    addIncompatibility: (item1, category1, item2, category2): EffectOrPromise<void> => {
      return E.tryPromise({
        try: () => addIncompatibilityUtil(get, set, item1, category1, item2, category2),
        catch: (error) => new Error(`Failed to add incompatibility: ${String(error)}`),
      });
    },

    removeIncompatibility: (item1, category1, item2, category2): EffectOrPromise<void> => {
      return E.tryPromise({
        try: () => removeIncompatibilityUtil(get, set, item1, category1, item2, category2),
        catch: (error) => new Error(`Failed to remove incompatibility: ${String(error)}`),
      });
    },

    isLayerTraitValid: (category, item, rarityConfig) => {
      return isLayerTraitValidUtil(get().activeSet, category, item, rarityConfig);
    },

    resetIfInvalid: (id: number, side: IncompatibilitySide, rarityConfig: RarityConfig): void => {
      resetIfInvalidUtil(get, set, id, side, rarityConfig);
    },

    cleanupIncompatibilities: (rarityConfig: RarityConfig): void => {
      cleanupIncompatibilitiesUtil(get, set, rarityConfig);
    },

    addIncompatibilitySelector: (): EffectOrPromise<void> => {
      return E.sync(() => {
        const newId = Math.max(...get().incompatibilitySelectors.map((s) => s.id), -1) + 1;
        set((state) => ({
          ...state,
          incompatibilitySelectors: [
            ...state.incompatibilitySelectors,
            { id: newId, firstCategory: '', firstItem: '', secondCategory: '', secondItem: '' },
          ],
        }));
      });
    },

    updateIncompatibilitySelector: (
      id: number,
      updates: Partial<IncompatibilitySelectorType>
    ): EffectOrPromise<void> => {
      return E.sync(() => {
        set((state) => ({
          ...state,
          incompatibilitySelectors: state.incompatibilitySelectors.map((selector) =>
            selector.id === id ? { ...selector, ...updates } : selector
          ),
        }));
      });
    },

    removeIncompatibilitySelector: (id: number): EffectOrPromise<void> => {
      return E.sync(() => {
        set((state) => ({
          ...state,
          incompatibilitySelectors: state.incompatibilitySelectors.filter(
            (selector) => selector.id !== id
          ),
        }));
      });
    },

    getActiveSetIncompatibilities: () => {
      return getActiveSetIncompatibilitiesMemoized(get().activeSet, get().incompatibilitiesBySets);
    },

    initializeSet: (setId): EffectOrPromise<void> => {
      return E.sync(() => {
        initializeSetUtil(get, set, setId);
      });
    },

    loadPersistedState,
    saveState: apiSaveState,
  };
});
