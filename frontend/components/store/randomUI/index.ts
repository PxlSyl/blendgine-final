import { create } from 'zustand';
import { useStore } from '../index';
import { ThemeName, themePalettes } from './themePalettes';

const getCurrentPalette = (): readonly string[] => {
  const { themeName } = useStore.getState();
  const theme = themeName as ThemeName;

  return themePalettes[theme] || themePalettes[ThemeName.THELAB];
};

interface ColorStore {
  colorMap: Record<string, string>;
  currentTheme: string;
  themeChangeCounter: number;
  getColorForKey: (key: string) => string;
  resetColorStore: () => void;
  checkThemeChange: () => void;
}

const initialState = {
  colorMap: {},
  currentTheme:
    (document.documentElement.getAttribute('data-theme') as ThemeName) || ThemeName.THELAB,
  themeChangeCounter: 0,
};

export const useColorStore = create<ColorStore>((set, get) => ({
  ...initialState,

  resetColorStore: () => {
    set(initialState);
  },

  checkThemeChange: () => {
    const { themeName } = useStore.getState();
    const currentTheme = (themeName as ThemeName) || ThemeName.THELAB;
    const { currentTheme: storedTheme, themeChangeCounter } = get();

    if (currentTheme !== storedTheme) {
      set({
        colorMap: {},
        currentTheme,
        themeChangeCounter: themeChangeCounter + 1,
      });
    }
  },

  getColorForKey: (key: string) => {
    const { colorMap, checkThemeChange } = get();

    checkThemeChange();

    if (colorMap[key]) {
      return colorMap[key];
    }

    const currentPalette = getCurrentPalette();
    const randomIndex = Math.floor(Math.random() * currentPalette.length);
    const newColor = currentPalette[randomIndex];

    set((state) => ({
      colorMap: {
        ...state.colorMap,
        [key]: newColor,
      },
    }));

    return newColor;
  },
}));
