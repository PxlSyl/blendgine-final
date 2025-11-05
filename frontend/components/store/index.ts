import { create } from 'zustand';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';

import { api } from '@/services';
import { emit } from '@tauri-apps/api/event';

import type { mainStoreActions, mainStoreState } from '@/types/stores';
import type { Tab } from '@/types/effect';

export const useStore = create<mainStoreState & mainStoreActions>((set) => ({
  darkMode: false,
  themeName: 'thelab',
  isCreateOpen: false,
  isManageOpen: false,
  isGenerating: false,
  message: '',
  step: 1,
  introStage: 0,
  activeTab: 'generate',
  activeSection: 'create',
  showExtraButtons: false,
  showTooltips: true,
  sidebarFull: true,
  renderer: 'gpu',

  setDarkMode: async (darkMode: boolean) => {
    const effect = Effect.gen(function* (_) {
      const { showTooltips, renderer, themeName } = useStore.getState();
      yield* _(
        Effect.tryPromise(() =>
          api.savePreferences({
            dark_mode: darkMode,
            showTooltips,
            renderer,
            theme_name: themeName,
          })
        )
      );

      document.documentElement.classList.toggle('dark', darkMode);

      yield* _(Effect.tryPromise(() => api.setTheme(darkMode)));

      set({ darkMode });

      if (window.__TAURI__) {
        yield* _(Effect.tryPromise(() => emit('theme-changed', { darkMode })));
      }
    });

    await Effect.runPromise(
      pipe(
        effect,
        Effect.catchAll((error) => {
          console.error('Failed to set dark mode:', error);
          return Effect.succeed(undefined);
        })
      )
    );
  },

  setThemeName: async (themeName) => {
    const currentDarkMode = useStore.getState().darkMode;

    const effect = Effect.gen(function* (_) {
      const { showTooltips, renderer } = useStore.getState();

      yield* _(
        Effect.tryPromise(() =>
          api.savePreferences({
            dark_mode: currentDarkMode,
            showTooltips,
            renderer,
            theme_name: themeName,
          })
        )
      );

      document.documentElement.setAttribute('data-theme', themeName);

      set({ themeName });

      const darkModeAfter = useStore.getState().darkMode;
      if (darkModeAfter !== currentDarkMode) {
        console.warn('Dark mode was changed during theme update! Restoring...');
        document.documentElement.classList.toggle('dark', currentDarkMode);
        set({ darkMode: currentDarkMode });
      }

      if (window.__TAURI__) {
        yield* _(Effect.tryPromise(() => api.setColorTheme(themeName)));
      }
    });

    await Effect.runPromise(
      pipe(
        effect,
        Effect.catchAll((error) => {
          console.error('Failed to set theme name:', error);
          return Effect.succeed(undefined);
        })
      )
    );
  },

  setShowTooltips: async (showTooltips: boolean) => {
    const effect = Effect.gen(function* (_) {
      const { darkMode, renderer, themeName } = useStore.getState();
      yield* _(
        Effect.tryPromise(() =>
          api.savePreferences({
            dark_mode: darkMode,
            showTooltips,
            renderer,
            theme_name: themeName,
          })
        )
      );
      set({ showTooltips });
    });

    await Effect.runPromise(
      pipe(
        effect,
        Effect.catchAll((error) => {
          console.error('Failed to set tooltips preference:', error);
          return Effect.succeed(undefined);
        })
      )
    );
  },

  setRenderer: async (renderer: 'cpu' | 'gpu') => {
    const effect = Effect.gen(function* (_) {
      const { darkMode, showTooltips, themeName } = useStore.getState();
      yield* _(
        Effect.tryPromise(() =>
          api.savePreferences({
            dark_mode: darkMode,
            showTooltips,
            renderer,
            theme_name: themeName,
          })
        )
      );
      yield* _(Effect.tryPromise(() => api.updateRendererPreference(renderer)));
      set({ renderer });
    });

    await Effect.runPromise(
      pipe(
        effect,
        Effect.catchAll((error) => {
          console.error('Failed to set renderer preference:', error);
          return Effect.succeed(undefined);
        })
      )
    );
  },

  checkAndSetOptimalRenderer: async () => {
    const effect = Effect.gen(function* (_) {
      const { renderer } = useStore.getState();

      if (renderer === 'cpu') {
        return;
      }

      const gpuCheck = yield* _(Effect.tryPromise(() => api.checkGpuAvailability()));

      if (!gpuCheck.available) {
        console.warn('GPU not available, falling back to CPU:', gpuCheck.error);
        const { darkMode, showTooltips, themeName } = useStore.getState();
        yield* _(
          Effect.tryPromise(() =>
            api.savePreferences({
              dark_mode: darkMode,
              showTooltips,
              renderer: 'cpu',
              theme_name: themeName,
            })
          )
        );
        set({ renderer: 'cpu' });
      }
    });

    await Effect.runPromise(
      pipe(
        effect,
        Effect.catchAll((error) => {
          console.error('Failed to check optimal renderer:', error);
          return Effect.succeed(undefined);
        })
      )
    );
  },

  loadPreferences: async () => {
    const effect = Effect.gen(function* (_) {
      const prefs = yield* _(Effect.tryPromise(() => api.loadPreferences()));

      document.documentElement.classList.toggle('dark', prefs.dark_mode);

      const themeName = prefs.theme_name ?? 'thelab';
      document.documentElement.setAttribute('data-theme', themeName);

      yield* _(Effect.tryPromise(() => api.setTheme(prefs.dark_mode)));
      yield* _(Effect.tryPromise(() => api.setColorTheme(themeName)));

      set({
        darkMode: prefs.dark_mode,
        themeName,
        showTooltips: prefs.showTooltips ?? true,
        renderer: prefs.renderer === 'cpu' ? 'cpu' : 'gpu',
      });

      yield* _(
        Effect.tryPromise(() =>
          api.updateRendererPreference(prefs.renderer === 'cpu' ? 'cpu' : 'gpu')
        )
      );

      yield* _(Effect.tryPromise(() => useStore.getState().checkAndSetOptimalRenderer()));
    });

    await Effect.runPromise(
      pipe(
        effect,
        Effect.catchAll((error) => {
          console.error('Failed to load preferences:', error);
          return Effect.gen(function* (_) {
            const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.classList.toggle('dark', prefersDarkMode);
            document.documentElement.setAttribute('data-theme', 'thelab');
            set({ darkMode: prefersDarkMode, themeName: 'thelab', renderer: 'gpu' });
            yield* _(Effect.tryPromise(() => api.setColorTheme('thelab')));
            yield* _(Effect.succeed(undefined));
          });
        })
      )
    );
  },

  setIsCreateOpen: (isOpen: boolean) => set({ isCreateOpen: isOpen }),
  setIsManageOpen: (isOpen: boolean) => set({ isManageOpen: isOpen }),
  setIsGenerating: (isGenerating: boolean) => set({ isGenerating }),
  setMessage: (message: string) => set({ message }),
  setStep: (step: number) => set({ step }),
  setIntroStage: (stage: number) => set({ introStage: stage }),
  setActiveTab: (tab: Tab) => set({ activeTab: tab }),
  setActiveSection: (section: string) => set({ activeSection: section }),
  setShowExtraButtons: (show: boolean) => set({ showExtraButtons: show }),
  setSidebarFull: (full: boolean) => set({ sidebarFull: full }),
}));
