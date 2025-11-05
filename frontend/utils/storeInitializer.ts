import { useFlipFlopStore } from '../components/store/filters/flipflop';
import { useProjectSetupStore } from '../components/store/projectSetup/main';
import { useLayerOrderStore } from '../components/store/layerOrder/main';
import { useFilterStore } from '../components/store/filters/files';
import { useGenerationSettingsStore } from '../components/store/generationsettings';
import { useTintingStore } from '../components/store/filters/main';
import { useGlobalRarityStore } from '../components/store/rarityStore/globalRarityStore';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';

export const initializeAllStores = () => {
  const initEffect = pipe(
    Effect.tryPromise(() =>
      Promise.all([initializeProjectSetup(), initializeLayerOrder(), initializeFilters()])
    ),
    Effect.flatMap(() => Effect.tryPromise(() => initializeImageSetup())),
    Effect.flatMap(() => Effect.tryPromise(() => initializeGlobalRarity())),
    Effect.catchAll((error) =>
      Effect.succeed(() => {
        console.error('Error initializing stores:', error);
      })
    )
  );

  return Effect.runPromise(initEffect);
};

const initializeProjectSetup = () => useProjectSetupStore.getState().loadPersistedState();

const initializeLayerOrder = () => useLayerOrderStore.getState().loadPersistedState();

const initializeFilters = () => {
  const initFiltersEffect = pipe(
    Effect.tryPromise(() =>
      Promise.all([
        useFilterStore.getState().initializeStore(),
        useFlipFlopStore.getState().loadFromBackend(),
      ])
    ),
    Effect.flatMap(() =>
      Effect.tryPromise(() => useTintingStore.getState().initializeTintingStore())
    ),
    Effect.catchAll((error) =>
      Effect.succeed(() => {
        console.error('Error initializing filters:', error);
      })
    )
  );

  return Effect.runPromise(initFiltersEffect);
};

const initializeImageSetup = () => {
  const initImageSetupEffect = pipe(
    Effect.tryPromise(() => {
      return useGenerationSettingsStore.getState().loadPersistedState();
    }),
    Effect.catchAll((error) =>
      Effect.succeed(() => {
        console.error('Error initializing image setup:', error);
      })
    )
  );

  return Effect.runPromise(initImageSetupEffect);
};

const initializeGlobalRarity = () => {
  const initGlobalRarityEffect = pipe(
    Effect.tryPromise(() => {
      return useGlobalRarityStore.getState().updateGlobalRarityFromConfig();
    }),
    Effect.catchAll((error) =>
      Effect.succeed(() => {
        console.error('Error initializing global rarity:', error);
      })
    )
  );

  return Effect.runPromise(initGlobalRarityEffect);
};
