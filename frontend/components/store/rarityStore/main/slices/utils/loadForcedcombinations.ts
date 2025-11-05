import * as E from 'effect/Effect';
import { pipe } from 'effect/Function';

import { api } from '@/services';

import type { ForcedCombinations } from '@/types/effect';

export const loadForcedCombinations = (
  currentSetId: string
): E.Effect<ForcedCombinations, Error, never> => {
  return pipe(
    E.tryPromise({
      try: () => api.loadForcedCombinationState(),
      catch: (error) => new Error(`Failed to load forced combinations: ${String(error)}`),
    }),
    E.flatMap((state) =>
      state?.[currentSetId]
        ? E.succeed(state[currentSetId] as ForcedCombinations)
        : E.succeed({} as ForcedCombinations)
    )
  );
};
