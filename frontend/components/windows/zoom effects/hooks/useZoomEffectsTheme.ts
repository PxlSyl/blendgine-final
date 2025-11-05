import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { api } from '@/services';

export const useZoomEffectsTheme = () => {
  useEffect(() => {
    const initTheme = async () => {
      try {
        const darkMode = await api.getTheme();
        const colorTheme = await api.getColorTheme();
        document.documentElement.classList.toggle('dark', darkMode);
        document.documentElement.setAttribute('data-theme', colorTheme);
      } catch (error) {
        console.error('Error getting theme:', error);
      }
    };
    void initTheme();

    let unlistenInitFn: (() => void) | undefined = undefined;
    let unlistenChangeFn: (() => void) | undefined = undefined;
    let unlistenColorThemeFn: (() => void) | undefined = undefined;

    void (async () => {
      try {
        if (
          typeof window !== 'undefined' &&
          '__TAURI__' in window &&
          typeof listen === 'function'
        ) {
          const unlistenInit = await listen(
            'zoom-effects-theme-init',
            (event: { payload: boolean }) => {
              const isDark = event.payload;
              document.documentElement.classList.toggle('dark', isDark);
            }
          );
          unlistenInitFn = unlistenInit;

          const unlistenChange = await listen(
            'theme-changed',
            (event: { payload: { darkMode: boolean } }) => {
              const { darkMode } = event.payload;
              document.documentElement.classList.toggle('dark', darkMode);
            }
          );
          unlistenChangeFn = unlistenChange;

          const unlistenColorTheme = await listen(
            'color-theme-changed',
            (event: { payload: string }) => {
              document.documentElement.setAttribute('data-theme', event.payload);
            }
          );
          unlistenColorThemeFn = unlistenColorTheme;
        }
      } catch (error) {
        console.error('Error setting up theme listeners:', error);
      }
    })();

    return () => {
      if (typeof unlistenInitFn === 'function') {
        unlistenInitFn();
      }
      if (typeof unlistenChangeFn === 'function') {
        unlistenChangeFn();
      }
      if (typeof unlistenColorThemeFn === 'function') {
        unlistenColorThemeFn();
      }
    };
  }, []);
};
