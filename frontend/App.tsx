import { useEffect } from 'react';
import { DndContext } from '@dnd-kit/core';
import { listen } from '@tauri-apps/api/event';
import { useStore } from './components/store';
import { useGenerateStore } from './components/store/generate';
import Intro from './components/intro';
import { initializeAllStores } from './utils/storeInitializer';
import Layout from './components/heading/Layout';
import { ThemeName } from './types/themes';

const App = () => {
  const introStage = useStore((state) => state.introStage);
  const darkMode = useStore((state) => state.darkMode);
  const themeName = useStore((state) => state.themeName);
  const handleIntroComplete = useGenerateStore((state) => state.handleIntroComplete);
  const { setThemeName } = useStore();

  useEffect(() => {
    void useStore.getState().loadPreferences();
    void initializeAllStores();
  }, []);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupThemeListener = async () => {
      try {
        unlisten = await listen<{ themeName: ThemeName }>('theme-colors-changed', (event) => {
          const { themeName: newThemeName } = event.payload;
          void setThemeName(newThemeName);
        });
      } catch (error) {
        console.error('App: Failed to setup theme colors listener:', error);
      }
    };

    void setupThemeListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [setThemeName]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (themeName) {
      document.documentElement.setAttribute('data-theme', themeName);
    }
  }, [themeName]);

  return (
    <DndContext>
      {introStage < 2 ? (
        <Intro onIntroComplete={handleIntroComplete} />
      ) : (
        <div className="h-screen flex flex-col font-sans">
          <Layout />
        </div>
      )}
    </DndContext>
  );
};
App.displayName = 'App';

export default App;
