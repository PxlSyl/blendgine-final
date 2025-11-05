import { useProjectSetupStore } from '../components/store/projectSetup/main';
import { useLayerOrderStore } from '../components/store/layerOrder/main';
import { useGenerationSettingsStore } from '../components/store/generationsettings';
import { useGlobalRarityStore } from '../components/store/rarityStore/globalRarityStore';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';

export const initializeAllStores = () => {
  const initEffect = pipe(
    Effect.tryPromise(() =>
      Promise.all([initializeProjectSetup(), initializeLayerOrder()])
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
