import { pipe } from 'effect/Function';
import * as O from 'effect/Option';
import * as E from 'effect/Effect';
import { match } from 'ts-pattern';
import { memoize } from '@/utils/effect/effectMemoize';
import {
  ForcedCombinationState,
  ForcedCombinationSide,
  ForcedCombinations,
  RarityConfig,
  ForcedCombinationsBySets,
} from '@/types/effect';
import { api } from '@/services';
import { updateObject } from '@/utils/effect/effectUpdater';

export const getActiveSetForcedCombinationsMemoized = memoize(
  (activeSet: string, forcedCombinationsBySets: ForcedCombinationsBySets): ForcedCombinations => {
    return pipe(
      O.fromNullable(forcedCombinationsBySets[activeSet]),
      O.match({
        onNone: () => ({}),
        onSome: (value) => value,
      })
    );
  },
  (activeSet, forcedCombinationsBySets) => {
    const hashParts = [`${activeSet}`];

    if (forcedCombinationsBySets[activeSet]) {
      const setData = forcedCombinationsBySets[activeSet] as Record<
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

          const linkedCategories = Object.keys(itemData);
          hashParts.push(`${category}.${item}:${linkedCategories.length}`);

          linkedCategories.forEach((linkedCategory) => {
            const linkedItems = itemData[linkedCategory] ?? [];
            if (Array.isArray(linkedItems)) {
              hashParts.push(`${category}.${item}.${linkedCategory}:${linkedItems.length}`);
            }
          });
        });
      });
    }

    return hashParts.join('|');
  }
);

export const addForcedCombination = (
  get: () => ForcedCombinationState,
  set: (state: Partial<ForcedCombinationState>) => void,
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

      if (!updatedState.forcedCombinationsBySets[activeSet]) {
        updatedState = updateObject(updatedState, {
          forcedCombinationsBySets: {
            ...updatedState.forcedCombinationsBySets,
            [activeSet]: {},
          },
        });
      }

      type ForcedCombType = Record<string, Record<string, Record<string, string[]>>>;
      const forcedCombinations = updatedState.forcedCombinationsBySets[activeSet] as ForcedCombType;

      if (forcedCombinations[category1]?.[item1]?.[category2]?.includes(item2)) {
        return;
      }

      if (forcedCombinations[category2]?.[item2]?.[category1]?.includes(item1)) {
        return;
      }

      const ensurePath = (
        obj: ForcedCombType,
        cat: string,
        item: string,
        targetCat: string
      ): ForcedCombType => {
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

      let combinations = ensurePath(forcedCombinations, category1, item1, category2);

      if (!combinations[category1][item1][category2].includes(item2)) {
        combinations = {
          ...combinations,
          [category1]: {
            ...combinations[category1],
            [item1]: {
              ...combinations[category1][item1],
              [category2]: [...combinations[category1][item1][category2], item2],
            },
          },
        };
        wasUpdated = true;
      }

      combinations = ensurePath(combinations, category2, item2, category1);

      if (!combinations[category2][item2][category1].includes(item1)) {
        combinations = {
          ...combinations,
          [category2]: {
            ...combinations[category2],
            [item2]: {
              ...combinations[category2][item2],
              [category1]: [...combinations[category2][item2][category1], item1],
            },
          },
        };
        wasUpdated = true;
      }

      if (wasUpdated) {
        const finalState = updateObject(updatedState, {
          forcedCombinationsBySets: {
            ...updatedState.forcedCombinationsBySets,
            [activeSet]: combinations,
          },
        });

        set(finalState);
        yield* _(
          E.tryPromise({
            try: () => api.saveForcedCombinationState(finalState.forcedCombinationsBySets),
            catch: (error) => new Error(`Failed to save forced combination: ${String(error)}`),
          })
        );
      }
    })
  );
};

export const removeForcedCombination = (
  get: () => ForcedCombinationState,
  set: (state: Partial<ForcedCombinationState>) => void,
  item1: string,
  category1: string,
  item2: string,
  category2: string
): Promise<void> => {
  return E.runPromise(
    E.gen(function* (_) {
      const { activeSet } = get();
      const updatedState = { ...get() };

      type ForcedCombType = Record<string, Record<string, Record<string, string[]>>>;
      const forcedCombinations = updatedState.forcedCombinationsBySets[activeSet] as ForcedCombType;
      if (!forcedCombinations) {
        return;
      }

      const removeInDirection = (
        combinations: ForcedCombType,
        cat1: string,
        it1: string,
        cat2: string,
        it2: string
      ): ForcedCombType => {
        if (!combinations[cat1]?.[it1]?.[cat2]) {
          return combinations;
        }

        let result = { ...combinations };

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

      let finalCombinations = removeInDirection(
        forcedCombinations,
        category1,
        item1,
        category2,
        item2
      );
      finalCombinations = removeInDirection(finalCombinations, category2, item2, category1, item1);

      const finalState = updateObject(updatedState, {
        forcedCombinationsBySets: {
          ...updatedState.forcedCombinationsBySets,
          [activeSet]: finalCombinations,
        },
      });

      set(finalState);
      yield* _(
        E.tryPromise({
          try: () => api.saveForcedCombinationState(finalState.forcedCombinationsBySets),
          catch: (error) => new Error(`Failed to save forced combination: ${String(error)}`),
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
    O.getOrElse(() => false)
  );
};

export const resetIfInvalid = (
  get: () => ForcedCombinationState,
  updateForcedCombinationSelector: (
    id: number,
    updates: Partial<{
      firstCategory: string;
      firstItem: string;
      secondCategory: string;
      secondItem: string;
    }>
  ) => void,
  id: number,
  side: ForcedCombinationSide,
  rarityConfig: RarityConfig
): void => {
  const selector = get().forcedCombinationSelectors.find((s) => s.id === id);
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
        updateForcedCombinationSelector(id, { firstCategory: '', firstItem: '' });
      }
    })
    .with('second', () => {
      if (
        selector.secondCategory &&
        selector.secondItem &&
        !isLayerTraitValid(activeSet, selector.secondCategory, selector.secondItem, rarityConfig)
      ) {
        updateForcedCombinationSelector(id, { secondCategory: '', secondItem: '' });
      }
    })
    .otherwise(() => {
      console.warn('Unknown side:', side);
    });
};

export const cleanupForcedCombinations = (
  get: () => ForcedCombinationState,
  set: (state: Partial<ForcedCombinationState>) => void,
  rarityConfig: RarityConfig
): void => {
  const { activeSet } = get();
  const forcedCombinations = get().forcedCombinationsBySets[activeSet];
  if (!forcedCombinations) {
    return;
  }

  let hasChanges = false;

  const newCombinations = { ...forcedCombinations } as Record<
    string,
    Record<string, Record<string, string[]>>
  >;

  Object.keys(newCombinations).forEach((category1) => {
    const items1 = newCombinations[category1];
    if (!items1) {
      return;
    }

    Object.keys(items1).forEach((item1) => {
      if (!isLayerTraitValid(activeSet, category1, item1, rarityConfig)) {
        delete newCombinations[category1][item1];
        hasChanges = true;
        return;
      }

      const linkedCategories = items1[item1];
      if (!linkedCategories) {
        return;
      }

      Object.keys(linkedCategories).forEach((category2) => {
        const currentItems = linkedCategories[category2];
        if (!Array.isArray(currentItems)) {
          return;
        }

        const validItems = currentItems.filter((item2) =>
          isLayerTraitValid(activeSet, category2, item2, rarityConfig)
        );

        if (validItems.length !== currentItems.length) {
          hasChanges = true;
          linkedCategories[category2] = validItems;
        }
      });
    });
  });

  if (hasChanges) {
    set({
      forcedCombinationsBySets: {
        ...get().forcedCombinationsBySets,
        [activeSet]: newCombinations,
      },
    });

    setTimeout(() => {
      void api.saveForcedCombinationState(get().forcedCombinationsBySets);
    }, 0);
  }
};

export const initializeSet = (
  get: () => ForcedCombinationState,
  set: (state: Partial<ForcedCombinationState>) => void,
  setId: string
): void => {
  set({
    forcedCombinationsBySets: {
      ...get().forcedCombinationsBySets,
      [setId]: {},
    },
  });
};
