import { useMemo, useCallback } from 'react';

import type { Incompatibilities, ForcedCombinations } from '@/types/effect';

type CombinationType = Incompatibilities | ForcedCombinations;

const filterCombinations = (combinations: CombinationType): CombinationType => {
  if (!combinations || Object.keys(combinations).length === 0) {
    return {};
  }

  const uniqueCombinations = new Set<string>();

  return Object.entries(combinations).reduce<CombinationType>((acc, [category1, items1]) => {
    acc[category1] = Object.entries(items1 ?? {}).reduce<Record<string, Record<string, string[]>>>(
      (itemAcc, [item1, categories]) => {
        itemAcc[item1] = Object.entries(categories ?? {}).reduce<Record<string, string[]>>(
          (categoryAcc, [category2, items]) => {
            if (Array.isArray(items)) {
              items.forEach((item2) => {
                const key = [category1, item1, category2, item2].sort().join('-');
                if (!uniqueCombinations.has(key)) {
                  uniqueCombinations.add(key);
                  if (!categoryAcc[category2]) {
                    categoryAcc[category2] = [];
                  }
                  if (!categoryAcc[category2].includes(item2)) {
                    categoryAcc[category2].push(item2);
                  }
                }
              });
            }
            return categoryAcc;
          },
          {}
        );
        return itemAcc;
      },
      {}
    );
    return acc;
  }, {});
};

const countCombinations = (combinations: CombinationType): number => {
  let count = 0;
  Object.values(combinations ?? {}).forEach((items) => {
    Object.values(items ?? {}).forEach((categories) => {
      Object.values(categories ?? {}).forEach((items) => {
        if (Array.isArray(items)) {
          count += items.length;
        }
      });
    });
  });
  return count;
};

export const useFilteredCombinations = (
  incompatibilities: Incompatibilities,
  forcedCombinations: ForcedCombinations
) => {
  const filteredIncompatibilities = useMemo(
    () => filterCombinations(incompatibilities),
    [incompatibilities]
  );

  const filteredForcedCombinations = useMemo(
    () => filterCombinations(forcedCombinations),
    [forcedCombinations]
  );

  const countIncompatibilities = useCallback(
    (data?: Incompatibilities) => countCombinations(data ?? incompatibilities),
    [incompatibilities]
  );

  const countForcedCombinations = useCallback(
    (data?: ForcedCombinations) => countCombinations(data ?? forcedCombinations),
    [forcedCombinations]
  );

  return {
    filteredIncompatibilities,
    filteredForcedCombinations,
    countIncompatibilities,
    countForcedCombinations,
  };
};
