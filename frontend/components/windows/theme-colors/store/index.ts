import { create } from 'zustand';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';

import { api } from '@/services';
import { isTauriEventSystemAvailable } from '@/utils/tauri';

export interface ThemeColorsState {
  isWindowOpen: boolean;
  openThemeColorsWindow: () => Promise<void>;
  closeThemeColorsWindow: () => Promise<void>;
  checkWindowStatus: () => Promise<boolean>;
}

const checkWindowStatusEffect = Effect.tryPromise({
  try: () => api.isThemeColorsWindowOpen(),
  catch: (error) => new Error(`Failed to check window status: ${String(error)}`),
});

const closeWindowEffect = Effect.tryPromise({
  try: () => api.closeThemeColorsWindow(),
  catch: (error) => new Error(`Failed to close window: ${String(error)}`),
});

const openWindowEffect = () =>
  Effect.gen(function* (_) {
    yield* _(Effect.log('Opening Theme Colors window'));

    yield* _(
      Effect.tryPromise({
        try: () => api.openThemeColorsWindow(),
        catch: (error) => new Error(`Failed to open window: ${String(error)}`),
      })
    );

    if (!isTauriEventSystemAvailable()) {
      return undefined;
    }

    yield* _(
      Effect.sync(() => {
        const unlistenPromise = api.onThemeColorsWindowClosed(() => {
          // Callback will be handled by the store
        });

        return unlistenPromise;
      })
    );

    return undefined;
  });

export const useThemeColorsStore = create<ThemeColorsState>((set) => {
  return {
    isWindowOpen: false,

    checkWindowStatus: async () => {
      const result = await Effect.runPromise(
        pipe(
          checkWindowStatusEffect,
          Effect.map((isOpen) => {
            set({ isWindowOpen: isOpen });
            return isOpen;
          }),
          Effect.catchAll((error) => {
            console.error('Error checking theme colors window status:', error);
            set({ isWindowOpen: false });
            return Effect.succeed(false);
          })
        )
      );
      return result;
    },

    closeThemeColorsWindow: async () => {
      await Effect.runPromise(
        pipe(
          closeWindowEffect,
          Effect.map(() => {
            set({ isWindowOpen: false });
            return undefined;
          }),
          Effect.catchAll((error) => {
            console.error('Error closing theme colors window:', error);
            return Effect.succeed(undefined);
          })
        )
      );
    },

    openThemeColorsWindow: async () => {
      await Effect.runPromise(
        pipe(
          openWindowEffect(),
          Effect.map(() => {
            set({ isWindowOpen: true });
            return undefined;
          }),
          Effect.catchAll((error) => {
            console.error('Error opening theme colors window:', error);
            set({ isWindowOpen: false });
            return Effect.succeed(undefined);
          })
        )
      );
    },
  };
});
