import { useState, useEffect, useRef, useCallback } from 'react';
import { ForcedCombinations, Incompatibilities } from '@/types/effect';
import * as S from '@effect/schema/Schema';
import * as E from 'effect/Effect';
import { pipe } from 'effect/Function';

import { api } from '@/services';

import { useIncompatibilitiesStore } from '@/components/windows/rules/store/incompatibilitiesStore';
import { useForcedCombinationStore } from '@/components/windows/rules/store/forcedCombinationsStore';

import { IncompatibilityStateSchema } from '@/schemas/effect/rulesStore/incompatibilitiesStore';
import { ForcedCombinationStateSchema } from '@/schemas/effect/rulesStore';

type StoreState = {
  incompatibilitiesStore: ReturnType<typeof useIncompatibilitiesStore.getState>;
  forcedCombinationsStore: ReturnType<typeof useForcedCombinationStore.getState>;
};

type CacheData = {
  incompatibilities: Record<string, Incompatibilities>;
  forcedCombinations: Record<string, ForcedCombinations>;
  lastUpdate: number;
};

export const useInitialData = (globalActiveSet: string) => {
  const [dataError, setDataError] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const cacheRef = useRef<CacheData>({
    incompatibilities: {},
    forcedCombinations: {},
    lastUpdate: 0,
  });
  const globalActiveSetRef = useRef(globalActiveSet);

  globalActiveSetRef.current = globalActiveSet;

  const fetchIncompatibilityData = (setId: string) =>
    pipe(
      E.tryPromise(() => {
        const cached = cacheRef.current.incompatibilities[setId];
        if (cached) {
          return Promise.resolve({ incompatibilitiesBySets: { [setId]: cached } });
        }
        return api.loadIncompatibilityState();
      }),
      E.map((data) => {
        if (data?.incompatibilitiesBySets?.[setId]) {
          cacheRef.current.incompatibilities[setId] = data.incompatibilitiesBySets[
            setId
          ] as Incompatibilities;
          cacheRef.current.lastUpdate = Date.now();
          return data.incompatibilitiesBySets[setId] as Incompatibilities;
        }
        return {} as Incompatibilities;
      }),
      E.catchAll((error) => {
        console.error(`LayerCombinations: Error fetching incompatibility data:`, error);
        setDataError(
          `Error loading incompatibility data: ${error instanceof Error ? error.message : String(error)}`
        );
        return E.succeed({} as Incompatibilities);
      })
    );

  const fetchForcedCombinationData = (setId: string) =>
    pipe(
      E.tryPromise(() => {
        const cached = cacheRef.current.forcedCombinations[setId];
        if (cached) {
          return Promise.resolve({ [setId]: cached });
        }
        return api.loadForcedCombinationState();
      }),
      E.map((data) => {
        if (data?.[setId] && typeof data[setId] === 'object') {
          cacheRef.current.forcedCombinations[setId] = data[setId] as ForcedCombinations;
          cacheRef.current.lastUpdate = Date.now();
          return data[setId] as ForcedCombinations;
        }
        return {} as ForcedCombinations;
      }),
      E.catchAll((error) => {
        console.error(`LayerCombinations: Error fetching forced combination data:`, error);
        setDataError(
          `Error loading forced combination data: ${error instanceof Error ? error.message : String(error)}`
        );
        return E.succeed({} as ForcedCombinations);
      })
    );

  const initializeStores = () =>
    pipe(
      E.tryPromise({
        try: async () => {
          const incompatibilitiesStore = useIncompatibilitiesStore.getState();
          const forcedCombinationsStore = useForcedCombinationStore.getState();

          await Promise.all([
            incompatibilitiesStore.initializeData(),
            forcedCombinationsStore.initializeData(),
          ]);

          return { incompatibilitiesStore, forcedCombinationsStore } as StoreState;
        },
        catch: (error) => new Error(`Failed to initialize stores: ${String(error)}`),
      })
    );

  const updateStores = useCallback(
    (stores: StoreState, incompatData: Record<string, unknown>, forcedData: ForcedCombinations) =>
      pipe(
        E.try({
          try: () => {
            if (Object.keys(incompatData).length > 0) {
              const incompatState = useIncompatibilitiesStore.getState();
              const newIncompatState = {
                ...incompatState,
                incompatibilitiesBySets: {
                  ...incompatState.incompatibilitiesBySets,
                  [globalActiveSetRef.current]: incompatData,
                },
              };

              try {
                S.decodeSync(IncompatibilityStateSchema)(newIncompatState);
                useIncompatibilitiesStore.setState(newIncompatState);
              } catch (error) {
                console.warn('Invalid incompatibility state:', error);
              }
            }

            if (Object.keys(forcedData).length > 0) {
              const forcedState = useForcedCombinationStore.getState();
              const newForcedState = {
                ...forcedState,
                forcedCombinationsBySets: {
                  ...forcedState.forcedCombinationsBySets,
                  [globalActiveSetRef.current]: forcedData,
                },
              };

              try {
                S.decodeSync(ForcedCombinationStateSchema)(newForcedState);
                useForcedCombinationStore.setState(newForcedState);
              } catch (error) {
                console.warn('Invalid forced combination state:', error);
              }
            }

            setRefreshCounter(Date.now());
          },
          catch: (error) => new Error(`Failed to update stores: ${String(error)}`),
        })
      ),
    []
  );

  useEffect(() => {
    let isMounted = true;
    const CACHE_DURATION = 5000;

    const loadInitialData = () =>
      pipe(
        E.tryPromise({
          try: async () => {
            if (isMounted) {
              setDataError(null);
            }

            const now = Date.now();
            if (now - cacheRef.current.lastUpdate < CACHE_DURATION) {
              return;
            }

            const stores = await pipe(initializeStores(), E.runPromise);
            const [incompatData, forcedData] = await Promise.all([
              pipe(fetchIncompatibilityData(globalActiveSet), E.runPromise) as Promise<
                Record<string, unknown>
              >,
              pipe(fetchForcedCombinationData(globalActiveSet), E.runPromise),
            ]);

            await pipe(updateStores(stores, incompatData, forcedData), E.runPromise);
          },
          catch: (error) => {
            console.error('LayerCombinations: Error during reset and reload:', error);
            setDataError(
              `Error reloading data: ${error instanceof Error ? error.message : String(error)}`
            );
          },
        }),
        E.runPromise
      );

    void loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [globalActiveSet, updateStores]);

  const forceRefresh = () => {
    cacheRef.current = {
      incompatibilities: {},
      forcedCombinations: {},
      lastUpdate: 0,
    };
    setRefreshCounter((prev) => prev + 1);
  };

  return {
    dataError,
    refreshCounter,
    forceRefresh,
  };
};
