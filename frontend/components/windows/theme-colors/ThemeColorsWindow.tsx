import React, { useState, useEffect } from 'react';
import { emit, listen } from '@tauri-apps/api/event';

import { useThemeColorsStore } from '@/components/windows/theme-colors/store';
import { ThemeName } from '@/types/themes';

import WindowLayout from '@/components/shared/WindowLayout';
import ThemeColorsList from './ThemeColorsList';

const ThemeColorsWindow: React.FC = () => {
  const closeThemeColorsWindow = useThemeColorsStore((state) => state.closeThemeColorsWindow);
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('thelab');

  useEffect(() => {
    const currentDataTheme = document.documentElement.getAttribute('data-theme') as ThemeName;
    if (currentDataTheme) {
      setCurrentTheme(currentDataTheme);
    }

    const setupThemeListeners = async () => {
      try {
        const unlistenInit = await listen<string>('theme-colors-color-theme-init', (event) => {
          const themeName = event.payload as ThemeName;
          setCurrentTheme(themeName);
        });

        const unlistenChanged = await listen<{ themeName: ThemeName }>(
          'theme-colors-changed',
          (event) => {
            const { themeName: newThemeName } = event.payload;
            setCurrentTheme(newThemeName);
          }
        );

        return () => {
          unlistenInit();
          unlistenChanged();
        };
      } catch (error) {
        console.error('ThemeColorsWindow: Failed to setup theme listeners:', error);
        return () => {};
      }
    };

    let unlisten: (() => void) | undefined;
    void setupThemeListeners().then((cleanup) => {
      unlisten = cleanup;
    });

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

  const handleThemeSelect = async (newThemeName: ThemeName) => {
    if (currentTheme !== newThemeName) {
      setCurrentTheme(newThemeName);

      document.documentElement.setAttribute('data-theme', newThemeName);

      try {
        await emit('theme-colors-changed', { themeName: newThemeName });
      } catch (error) {
        console.error('ThemeColorsWindow: Failed to emit theme change event:', error);
      }
    }
  };

  return (
    <WindowLayout
      onClose={() => void closeThemeColorsWindow()}
      containerClassName="theme-colors-window-container"
    >
      <ThemeColorsList
        currentTheme={currentTheme}
        onThemeSelect={(themeName) => void handleThemeSelect(themeName)}
      />
    </WindowLayout>
  );
};

export default ThemeColorsWindow;
