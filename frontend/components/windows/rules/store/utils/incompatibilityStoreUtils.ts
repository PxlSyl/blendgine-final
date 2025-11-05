import { pipe } from 'effect/Function';
import * as O from 'effect/Option';
import * as E from 'effect/Effect';
import { match } from 'ts-pattern';

import { api } from '@/services';

import type {
  IncompatibilityState,
  Incompatibilities,
  RarityConfig,
  IncompatibilitiesBySets,
} from '@/types/effect';
import type { ResetIfInvalidFn, CleanupIncompatibilitiesFn } from '../incompatibilitiesStore/types';

import { memoize } from '@/utils/effect/effectMemoize';
import { updateObject } from '@/utils/effect/effectUpdater';

export const getActiveSetIncompatibilitiesMemoized = memoize(
  (activeSet: string, incompatibilitiesBySets: IncompatibilitiesBySets): Incompatibilities => {
    return pipe(
      O.fromNullable(incompatibilitiesBySets[activeSet]),
      O.match({
        onNone: () => ({}),
        onSome: (value) => value,
      })
    );
  },
  (activeSet, incompatibilitiesBySets) => {
    const hashParts = [`${activeSet}`];

    if (incompatibilitiesBySets[activeSet]) {
      const setData = incompatibilitiesBySets[activeSet] as Record<
        string,
        Record<string, Record<string, string[]>>
      >;

      const categories = Object.keys(setData);
      hashParts.push(`cats:${categories.length}`);

      categories.forEach((category) => {
        const categoryData = setData[category];
        if (!categoryData) {
          return;
        }

        const items = Object.keys(categoryData);
        hashParts.push(`${category}:${items.length}`);

        items.forEach((item) => {
          const itemData = categoryData[item];
          if (!itemData) {
            return;
          }

          const incompatibleCategories = Object.keys(itemData);
          hashParts.push(`${category}.${item}:${incompatibleCategories.length}`);

          incompatibleCategories.forEach((incompatCategory) => {
            const incompatibleItems = itemData[incompatCategory] ?? [];
            if (Array.isArray(incompatibleItems)) {
              hashParts.push(`${category}.${item}.${incompatCategory}:${incompatibleItems.length}`);
            }
          });
        });
      });
    }

    return hashParts.join('|');
  }
);

export const addIncompatibility = (
  get: () => IncompatibilityState,
  set: (state: Partial<IncompatibilityState>) => void,
  item1: string,
  category1: string,
  item2: string,
  category2: string
): Promise<void> => {
  return E.runPromise(
    E.gen(function* (_) {
      const { activeSet } = get();
      let wasUpdated = false;
      let updatedState = { ...get() };

      if (!updatedState.incompatibilitiesBySets[activeSet]) {
        updatedState = updateObject(updatedState, {
          incompatibilitiesBySets: {
            ...updatedState.incompatibilitiesBySets,
            [activeSet]: {},
          },
        });
      }

      type IncompatType = Record<string, Record<string, Record<string, string[]>>>;
      const incompatibilities = updatedState.incompatibilitiesBySets[activeSet] as IncompatType;

      if (incompatibilities[category1]?.[item1]?.[category2]?.includes(item2)) {
        return;
      }

      if (incompatibilities[category2]?.[item2]?.[category1]?.includes(item1)) {
        return;
      }

      const ensurePath = (
        obj: IncompatType,
        cat: string,
        item: string,
        targetCat: string
      ): IncompatType => {
        let result = obj;

        if (!result[cat]) {
          result = { ...result, [cat]: {} };
        }

        if (!result[cat][item]) {
          result = {
            ...result,
            [cat]: { ...result[cat], [item]: {} },
          };
        }

        if (!result[cat][item][targetCat]) {
          result = {
            ...result,
            [cat]: {
              ...result[cat],
              [item]: { ...result[cat][item], [targetCat]: [] },
            },
          };
        }

        return result;
      };

      let incompats = ensurePath(incompatibilities, category1, item1, category2);

      if (!incompats[category1][item1][category2].includes(item2)) {
        incompats = {
          ...incompats,
          [category1]: {
            ...incompats[category1],
            [item1]: {
              ...incompats[category1][item1],
              [category2]: [...incompats[category1][item1][category2], item2],
            },
          },
        };
        wasUpdated = true;
      }

      incompats = ensurePath(incompats, category2, item2, category1);

      if (!incompats[category2][item2][category1].includes(item1)) {
        incompats = {
          ...incompats,
          [category2]: {
            ...incompats[category2],
            [item2]: {
              ...incompats[category2][item2],
              [category1]: [...incompats[category2][item2][category1], item1],
            },
          },
        };
        wasUpdated = true;
      }

      if (wasUpdated) {
        const finalState = updateObject(updatedState, {
          incompatibilitiesBySets: {
            ...updatedState.incompatibilitiesBySets,
            [activeSet]: incompats,
          },
        });

        set(finalState);
        yield* _(
          E.tryPromise({
            try: () => api.saveIncompatibilityState(finalState.incompatibilitiesBySets),
            catch: (error) => new Error(`Failed to save incompatibility: ${String(error)}`),
          })
        );
      }
    })
  );
};

export const removeIncompatibility = (
  get: () => IncompatibilityState,
  set: (state: Partial<IncompatibilityState>) => void,
  item1: string,
  category1: string,
  item2: string,
  category2: string
): Promise<void> => {
  return E.runPromise(
    E.gen(function* (_) {
      const { activeSet } = get();
      const updatedState = { ...get() };

      type IncompatType = Record<string, Record<string, Record<string, string[]>>>;
      const incompatibilities = updatedState.incompatibilitiesBySets[activeSet] as IncompatType;
      if (!incompatibilities) {
        return;
      }

      const removeInDirection = (
        incompat: IncompatType,
        cat1: string,
        it1: string,
        cat2: string,
        it2: string
      ): IncompatType => {
        if (!incompat[cat1]?.[it1]?.[cat2]) {
          return incompat;
        }

        let result = { ...incompat };

        const items = result[cat1][it1][cat2].filter((i) => i !== it2);

        if (items.length === 0) {
          const updatedItem = { ...result[cat1][it1] };
          delete updatedItem[cat2];

          if (Object.keys(updatedItem).length === 0) {
            const updatedCat = { ...result[cat1] };
            delete updatedCat[it1];

            if (Object.keys(updatedCat).length === 0) {
              result = { ...result };
              delete result[cat1];
            } else {
              result = { ...result, [cat1]: updatedCat };
            }
          } else {
            result = {
              ...result,
              [cat1]: {
                ...result[cat1],
                [it1]: updatedItem,
              },
            };
          }
        } else {
          result = {
            ...result,
            [cat1]: {
              ...result[cat1],
              [it1]: {
                ...result[cat1][it1],
                [cat2]: items,
              },
            },
          };
        }

        return result;
      };

      let updatedIncompat = removeInDirection(
        incompatibilities,
        category1,
        item1,
        category2,
        item2
      );

      updatedIncompat = removeInDirection(updatedIncompat, category2, item2, category1, item1);

      const finalState = updateObject(updatedState, {
        incompatibilitiesBySets: {
          ...updatedState.incompatibilitiesBySets,
          [activeSet]: updatedIncompat,
        },
      });

      set(finalState);
      yield* _(
        E.tryPromise({
          try: () => api.saveIncompatibilityState(finalState.incompatibilitiesBySets),
          catch: (error) => new Error(`Failed to remove incompatibility: ${String(error)}`),
        })
      );
    })
  );
};

export const isLayerTraitValid = (
  activeSet: string,
  category: string,
  item: string,
  rarityConfig?: RarityConfig
): boolean => {
  if (!rarityConfig) {
    return false;
  }

  return pipe(
    O.fromNullable(rarityConfig[category]?.traits?.[item]?.sets?.[activeSet]?.enabled),
    O.match({
      onNone: () => false,
      onSome: (value) => value,
    })
  );
};

export const resetIfInvalid: ResetIfInvalidFn = (get, set, id, side, rarityConfig) => {
  const selector = get().incompatibilitySelectors.find((s) => s.id === id);
  if (!selector) {
    return;
  }

  const { activeSet } = get();

  match(side)
    .with('first', () => {
      if (
        selector.firstCategory &&
        selector.firstItem &&
        !isLayerTraitValid(activeSet, selector.firstCategory, selector.firstItem, rarityConfig)
      ) {
        set((state) => ({
          ...state,
          incompatibilitySelectors: state.incompatibilitySelectors.map((s) =>
            s.id === id ? { ...s, firstCategory: '', firstItem: '' } : s
          ),
        }));
      }
    })
    .with('second', () => {
      if (
        selector.secondCategory &&
        selector.secondItem &&
        !isLayerTraitValid(activeSet, selector.secondCategory, selector.secondItem, rarityConfig)
      ) {
        set((state) => ({
          ...state,
          incompatibilitySelectors: state.incompatibilitySelectors.map((s) =>
            s.id === id ? { ...s, secondCategory: '', secondItem: '' } : s
          ),
        }));
      }
    })
    .otherwise(() => {
      console.warn('Unknown side:', side);
    });
};

export const cleanupIncompatibilities: CleanupIncompatibilitiesFn = (get, set, rarityConfig) => {
  const state = get();
  const updatedSelectors = state.incompatibilitySelectors.map((selector) => {
    const firstValid = isLayerTraitValid(
      state.activeSet,
      selector.firstCategory,
      selector.firstItem,
      rarityConfig
    );
    const secondValid = isLayerTraitValid(
      state.activeSet,
      selector.secondCategory,
      selector.secondItem,
      rarityConfig
    );

    if (!firstValid || !secondValid) {
      return {
        ...selector,
        firstCategory: firstValid ? selector.firstCategory : '',
        firstItem: firstValid ? selector.firstItem : '',
        secondCategory: secondValid ? selector.secondCategory : '',
        secondItem: secondValid ? selector.secondItem : '',
      };
    }
    return selector;
  });

  set((state) => ({
    ...state,
    incompatibilitySelectors: updatedSelectors,
  }));
};

export const initializeSet = (
  get: () => IncompatibilityState,
  set: (state: Partial<IncompatibilityState>) => void,
  setId: string
): void => {
  const state = get();

  if (state.incompatibilitiesBySets[setId]) {
    return;
  }

  const updatedState = updateObject(state, {
    incompatibilitiesBySets: {
      ...state.incompatibilitiesBySets,
      [setId]: {},
    },
  });

  set(updatedState);

  api.saveIncompatibilityState(updatedState.incompatibilitiesBySets).catch(console.error);
};
