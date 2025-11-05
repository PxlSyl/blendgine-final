import { create } from 'zustand';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';

import { api } from '@/services';
import { isTauriEventSystemAvailable } from '@/utils/tauri';

export interface ShortcutsState {
  isWindowOpen: boolean;
  category?: string;
  openShortcutsWindow: (options?: { category?: string }) => Promise<void>;
  closeShortcutsWindow: () => Promise<void>;
  checkWindowStatus: () => Promise<boolean>;
  setCategory: (category?: string) => void;
}

const checkWindowStatusEffect = Effect.tryPromise({
  try: () => api.isShortcutsWindowOpen(),
  catch: (error) => new Error(`Failed to check window status: ${String(error)}`),
});

const closeWindowEffect = Effect.tryPromise({
  try: () => api.closeShortcutsWindow(),
  catch: (error) => new Error(`Failed to close window: ${String(error)}`),
});

const openWindowEffect = (_category?: string) =>
  Effect.gen(function* (_) {
    yield* _(Effect.log('Opening Shortcuts window'));

    yield* _(
      Effect.tryPromise({
        try: () => api.openShortcutsWindow(),
        catch: (error) => new Error(`Failed to open window: ${String(error)}`),
      })
    );

    if (!isTauriEventSystemAvailable()) {
      return undefined;
    }

    yield* _(
      Effect.sync(() => {
        const unlistenPromise = api.onShortcutsWindowClosed(() => {
          // Callback will be handled by the store
        });

        return unlistenPromise;
      })
    );

    return undefined;
  });

export const useShortcutsStore = create<ShortcutsState>((set) => {
  return {
    isWindowOpen: false,
    category: undefined,

    setCategory: (category) => set({ category }),

    checkWindowStatus: async () => {
      const result = await Effect.runPromise(
        pipe(
          checkWindowStatusEffect,
          Effect.map((isOpen) => {
            set({ isWindowOpen: isOpen });
            return isOpen;
          }),
          Effect.catchAll((error) => {
            console.error('Error checking shortcuts window status:', error);
            set({ isWindowOpen: false });
            return Effect.succeed(false);
          })
        )
      );
      return result;
    },

    closeShortcutsWindow: async () => {
      await Effect.runPromise(
        pipe(
          closeWindowEffect,
          Effect.map(() => {
            set({ isWindowOpen: false });
            return undefined;
          }),
          Effect.catchAll((error) => {
            console.error('Error closing shortcuts window:', error);
            return Effect.succeed(undefined);
          })
        )
      );
    },

    openShortcutsWindow: async (options = {}) => {
      set({ category: options.category });

      await Effect.runPromise(
        pipe(
          openWindowEffect(options.category),
          Effect.map(() => {
            set({ isWindowOpen: true });
            return undefined;
          }),
          Effect.catchAll((error) => {
            console.error('Error opening shortcuts window:', error);
            set({ isWindowOpen: false });
            return Effect.succeed(undefined);
          })
        )
      );
    },
  };
});
