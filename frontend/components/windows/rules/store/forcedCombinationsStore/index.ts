import { create } from 'zustand';
import { pipe } from 'effect/Function';
import * as O from 'effect/Option';
import * as E from 'effect/Effect';

import { api } from '@/services';

import type {
  ForcedCombinationState,
  ForcedCombinations,
  ForcedCombinationsBySets,
} from '@/types/effect';

import type {
  ForcedCombinationStore,
  LayerOrderState,
} from '@/components/windows/rules/store/forcedCombinationsStore/types';

import { ForcedCombinationStateSchema } from '@/schemas/effect/rulesStore';
import { ForcedCombinationsSchema } from '@/schemas/effect/layerOrder';
import * as S from '@effect/schema/Schema';
import { memoize } from '@/utils/effect/effectMemoize';
import {
  addForcedCombination,
  removeForcedCombination,
  isLayerTraitValid,
  resetIfInvalid,
  cleanupForcedCombinations,
  initializeSet,
} from '../utils/forcedCombinationStoreUtils';

const initialState: ForcedCombinationState = {
  forcedCombinationsBySets: {} as ForcedCombinationsBySets,
  forcedCombinationSelectors: [
    { id: 0, firstCategory: '', firstItem: '', secondCategory: '', secondItem: '' },
  ],
  activeSet: 'set1',
  availableSets: [1],
};

const updateState = <T>(state: T, updates: Partial<T>): T => ({ ...state, ...updates });

const getActiveSetForcedCombinationsMemoized = memoize(
  (activeSet: string, forcedCombinationsBySets: ForcedCombinationsBySets): ForcedCombinations => {
    return pipe(
      O.fromNullable(forcedCombinationsBySets[activeSet]),
      O.getOrElse(() => ({}))
    );
  },
  (activeSet, forcedCombinationsBySets) => {
    const hashParts = [`${activeSet}`];

    if (forcedCombinationsBySets[activeSet]) {
      const setData = forcedCombinationsBySets[activeSet];

      const categories = Object.keys(setData);
      hashParts.push(`cats:${categories.length}`);

      categories.forEach((category) => {
        const items = Object.keys(setData[category] ?? {});
        hashParts.push(`${category}:${items.length}`);

        items.forEach((item) => {
          const linkedCategories = Object.keys(
            (setData[category] as Record<string, Record<string, unknown>>)?.[item] ?? {}
          );
          hashParts.push(`${category}.${item}:${linkedCategories.length}`);

          linkedCategories.forEach((linkedCategory) => {
            const linkedItems =
              (setData[category] as Record<string, Record<string, unknown>>)?.[item]?.[
                linkedCategory
              ] ?? [];
            hashParts.push(
              `${category}.${item}.${linkedCategory}:${Array.isArray(linkedItems) ? linkedItems.length : 0}`
            );
          });
        });
      });
    }

    return hashParts.join('|');
  }
);

export const useForcedCombinationStore = create<ForcedCombinationStore>((set, get) => ({
  ...initialState,

  _cachedLayerOrderState: {
    sets: {},
    activeSetId: '',
    layerOrder: [],
  },
  _dataInitialized: false,

  _refreshLayerOrderCache: async () => {
    const refreshEffect = pipe(
      E.tryPromise(() => api.loadLayerOrderState()),
      E.flatMap((layerOrderState) => {
        const stateWithLayerOrder: LayerOrderState = {
          ...layerOrderState,
          layerOrder: layerOrderState?.sets?.[layerOrderState.activeSetId]?.layers || [],
        };
        return E.succeed(stateWithLayerOrder);
      }),
      E.tap((stateWithLayerOrder) =>
        E.sync(() => {
          set((state) => updateState(state, { _cachedLayerOrderState: stateWithLayerOrder }));
        })
      ),
      E.catchAll((error) => {
        console.error('Error refreshing layer order cache:', error);
        return E.succeed({ sets: {}, activeSetId: '', layerOrder: [] });
      })
    );

    return E.runPromise(refreshEffect) as Promise<LayerOrderState>;
  },

  setActiveSet: (setId: string) => {
    return E.sync(() => {
      set((state) => ({
        ...state,
        activeSet: setId,
      }));
    });
  },

  setAvailableSets: (sets: number[]) => {
    set({ availableSets: sets });
  },

  updateState: (state: Partial<ForcedCombinationState>): E.Effect<void, Error, never> => {
    return pipe(
      E.try({
        try: () => {
          const partialSchema = S.partial(ForcedCombinationStateSchema);
          return S.decodeSync(partialSchema)(state);
        },
        catch: (error) =>
          new Error(
            `Invalid state update: ${error instanceof Error ? error.message : String(error)}`
          ),
      }),
      E.tap((validState) => E.sync(() => set(validState))),
      E.map(() => undefined)
    );
  },

  resetStore: async () => {
    set(initialState);
    await get().saveState();
  },

  resetCombinationStore: async () => {
    const resetEffect = pipe(
      E.tryPromise(() => get().resetStore()),
      E.catchAll((error) => {
        console.error('Error resetting forced combination store:', error);
        return E.succeed(undefined);
      })
    );

    return E.runPromise(resetEffect) as Promise<void>;
  },

  addForcedCombinationSelector: () => {
    set((state) => ({
      forcedCombinationSelectors: [
        ...state.forcedCombinationSelectors,
        {
          id: state.forcedCombinationSelectors.length,
          firstCategory: '',
          firstItem: '',
          secondCategory: '',
          secondItem: '',
        },
      ],
    }));
  },

  updateForcedCombinationSelector: (id, updates) => {
    return E.sync(() => {
      set((state) => ({
        forcedCombinationSelectors: state.forcedCombinationSelectors.map((selector) =>
          selector.id === id ? { ...selector, ...updates } : selector
        ),
      }));
    });
  },

  removeForcedCombinationSelector: (id) => {
    set((state) => ({
      forcedCombinationSelectors: state.forcedCombinationSelectors.filter(
        (selector) => selector.id !== id
      ),
    }));
  },

  addForcedCombination: (item1, category1, item2, category2) => {
    return addForcedCombination(get, set, item1, category1, item2, category2);
  },

  removeForcedCombination: (item1, category1, item2, category2) => {
    return removeForcedCombination(get, set, item1, category1, item2, category2);
  },

  updateForcedCombinationRarity: (layer1, trait1, layer2, trait2, newRarity) => {
    return E.runPromise(
      E.tryPromise({
        try: async () => {
          set((state) => {
            const newState = { ...state };
            const selectors = newState.forcedCombinationSelectors;

            const matchingSelector = selectors.find(
              (s) =>
                (s.firstCategory === layer1 &&
                  s.firstItem === trait1 &&
                  s.secondCategory === layer2 &&
                  s.secondItem === trait2) ||
                (s.firstCategory === layer2 &&
                  s.firstItem === trait2 &&
                  s.secondCategory === layer1 &&
                  s.secondItem === trait1)
            );

            if (matchingSelector) {
              const selectorWithRarity = matchingSelector as typeof matchingSelector & {
                rarity: number;
              };
              selectorWithRarity.rarity = newRarity;
            }

            return newState;
          });

          await get().saveState();
        },
        catch: (error) => new Error(`Failed to update forced combination rarity: ${String(error)}`),
      })
    );
  },

  loadPersistedState: async () => {
    return E.runPromise(
      pipe(
        E.tryPromise(() => api.loadForcedCombinationState()),
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

                const normalizedData: ForcedCombinationState = {
                  forcedCombinationsBySets: storedData as unknown as ForcedCombinationsBySets,
                  forcedCombinationSelectors: [
                    { id: 0, firstCategory: '', firstItem: '', secondCategory: '', secondItem: '' },
                  ],
                  activeSet: get().activeSet || 'set1',
                  availableSets: get().availableSets || [1],
                };

                return S.decodeSync(ForcedCombinationStateSchema)(normalizedData);
              },
              catch: (error) => {
                console.warn('Invalid stored data, using initial state:', error);
                return initialState;
              },
            })
          );
        }),
        E.tap((finalData) => {
          const currentCache = get()._cachedLayerOrderState;
          return E.sync(() =>
            set({
              ...finalData,
              _dataInitialized: true,
              _cachedLayerOrderState: currentCache,
            })
          );
        })
      )
    ) as Promise<ForcedCombinationState>;
  },

  saveState: async () => {
    return E.runPromise(
      E.tryPromise({
        try: async () => {
          const state = get();

          const { forcedCombinationsBySets } = state;

          try {
            S.decodeSync(ForcedCombinationsSchema)(forcedCombinationsBySets);
          } catch (error) {
            console.warn('Invalid state before saving:', error);
          }

          await api.saveForcedCombinationState(forcedCombinationsBySets);
        },
        catch: (error) => new Error(`Failed to save state: ${String(error)}`),
      })
    );
  },

  isLayerTraitValid: (layer, trait, rarityConfig) => {
    return isLayerTraitValid(get().activeSet, layer, trait, rarityConfig);
  },

  resetIfInvalid: (id, side, rarityConfig): void => {
    const updateWrapper = (
      id: number,
      updates: Partial<{
        firstCategory: string;
        firstItem: string;
        secondCategory: string;
        secondItem: string;
      }>
    ): void => {
      const effectOrPromise = get().updateForcedCombinationSelector(id, updates);
      const effect = E.isEffect(effectOrPromise) ? effectOrPromise : E.sync(() => effectOrPromise);
      E.runSync(effect);
    };
    resetIfInvalid(get, updateWrapper, id, side, rarityConfig);
  },

  cleanupForcedCombinations: (rarityConfig) => {
    cleanupForcedCombinations(get, set, rarityConfig);
  },

  initializeSet: (setId) => {
    initializeSet(get, set, setId);
  },

  getLowerLayer: (layer1, layer2) => {
    const layerOrderState = get()._cachedLayerOrderState;

    if (!layerOrderState?.layerOrder || !Array.isArray(layerOrderState.layerOrder)) {
      return layer1;
    }

    const { layerOrder } = layerOrderState;
    const index1 = layerOrder.indexOf(layer1);
    const index2 = layerOrder.indexOf(layer2);

    if (index1 === -1) {
      return layer2;
    }
    if (index2 === -1) {
      return layer1;
    }

    return index1 < index2 ? layer1 : layer2;
  },

  getActiveSetForcedCombinations: () => {
    const { activeSet } = get();
    return getActiveSetForcedCombinationsMemoized(activeSet, get().forcedCombinationsBySets);
  },

  resetForcedCombinationStateForActiveSet: async () => {
    return E.runPromise(
      E.tryPromise({
        try: async () => {
          const { activeSet } = get();

          set((state) => {
            const newState = { ...state };
            newState.forcedCombinationsBySets[activeSet] = {};
            return newState;
          });

          await get().saveState();
        },
        catch: (error) =>
          new Error(`Failed to reset forced combination state for active set: ${String(error)}`),
      })
    );
  },

  resetForcedCombinationStore: async () => {
    return E.runPromise(
      E.tryPromise({
        try: async () => {
          set((state) => {
            const newState = { ...state };
            newState.forcedCombinationsBySets = {};
            return newState;
          });

          await get().saveState();
        },
        catch: (error) => new Error(`Failed to reset forced combination store: ${String(error)}`),
      })
    );
  },

  initializeData: async () => {
    if (get()._dataInitialized) {
      return E.runPromise(E.void);
    }

    return E.runPromise(
      pipe(
        E.tryPromise(() => get().loadPersistedState()),
        E.tap(() => E.sync(() => set((current) => ({ ...current, _dataInitialized: true })))),
        E.catchAll((error) => {
          console.error('ForcedCombinationsStore: Error during data initialization:', error);
          return E.void;
        })
      )
    ) as Promise<void>;
  },
}));
