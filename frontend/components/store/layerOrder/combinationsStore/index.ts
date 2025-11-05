import { create } from 'zustand';
import { Effect, pipe } from 'effect';

import { api } from '@/services';

import type { CombinationsState, CombinationsActions } from './types';
import type { LayerConfig } from '@/types/effect';

import { safeValidate } from '@/utils/effect/effectValidation';
import {
  CalculateCombinationsInputSchema,
  createDefaultCombinationsState,
} from '@/schemas/effect/layerOrder/combinationsStore';

type CombinationsStore = CombinationsState & CombinationsActions;

const initialState: CombinationsState = createDefaultCombinationsState();

const calculateCombinationsEffect = (inputData: {
  rarityConfig: Record<string, LayerConfig>;
  activeSetId: string;
  currentLayers: string[];
}) =>
  pipe(
    Effect.succeed(
      inputData.currentLayers.reduce(
        (acc, layer) => {
          const layerConfig = inputData.rarityConfig[layer];
          if (layerConfig?.sets?.[inputData.activeSetId]?.active) {
            acc.hasActiveLayers = true;
            if (layerConfig.traits) {
              const enabledTraitsCount = Object.entries(layerConfig.traits).filter(
                ([, trait]) => trait.sets?.[inputData.activeSetId]?.enabled
              ).length;
              if (enabledTraitsCount > 0) {
                acc.combinations *= enabledTraitsCount;
              }
            }
          }
          return acc;
        },
        { combinations: 1, hasActiveLayers: false }
      )
    ),
    Effect.map((result) => (result.hasActiveLayers ? result.combinations : 0))
  );

export const useCombinationsStore = create<CombinationsStore>((set) => ({
  ...initialState,

  setPossibleCombinations: (count: number) => {
    const validCount = Math.max(0, count);
    set({ possibleCombinations: validCount });
  },

  calculatePossibleCombinations: async (setId?: string): Promise<number> => {
    set({ loading: true, error: undefined });

    const program = pipe(
      Effect.gen(function* (_) {
        const layerOrderState = yield* _(Effect.promise(() => api.loadLayerOrderState()));
        const rarityConfig = yield* _(Effect.promise(() => api.loadRarityConfig()));

        const inputData = {
          rarityConfig,
          activeSetId: setId ?? layerOrderState.activeSetId ?? 'set1',
        };

        const validationResult = yield* _(
          Effect.succeed(safeValidate(CalculateCombinationsInputSchema, inputData))
        );

        if (!validationResult.success) {
          return Effect.fail(new Error(validationResult.errors?.join(', ') ?? 'Validation failed'));
        }

        const { activeSetId } = inputData;
        const currentLayers = layerOrderState.sets[activeSetId]?.layers || [];

        return yield* _(
          calculateCombinationsEffect({
            rarityConfig,
            activeSetId,
            currentLayers,
          })
        );
      }),
      Effect.catchAll(() => Effect.succeed(0)),
      Effect.map((result) => result as number)
    );

    const result = await pipe(
      Effect.tryPromise({
        try: () => Effect.runPromise(program),
        catch: (error) => {
          console.error('Error calculating possible combinations:', error);
          set({ loading: false, error: error instanceof Error ? error.message : 'Unknown error' });
          return 0;
        },
      }),
      Effect.tap((result) =>
        Effect.sync(() => set({ possibleCombinations: result, loading: false }))
      ),
      Effect.runPromise
    );

    return result;
  },
}));
