export type ThemeName =
  | 'thelab'
  | 'fresh'
  | 'sunset'
  | 'forest'
  | 'sky'
  | 'neon'
  | 'mono'
  | 'prism'
  | 'desert'
  | 'coral';

export interface Theme {
  name: ThemeName;
  displayName: string;
}

export const themes: Record<ThemeName, Theme> = {
  coral: {
    name: 'coral',
    displayName: 'Coral',
  },
  desert: {
    name: 'desert',
    displayName: 'Desert',
  },
  fresh: {
    name: 'fresh',
    displayName: 'Fresh',
  },
  forest: {
    name: 'forest',
    displayName: 'Forest',
  },
  mono: {
    name: 'mono',
    displayName: 'Mono',
  },
  neon: {
    name: 'neon',
    displayName: 'Neon',
  },
  prism: {
    name: 'prism',
    displayName: 'Prism',
  },
  sky: {
    name: 'sky',
    displayName: 'Sky',
  },
  sunset: {
    name: 'sunset',
    displayName: 'Sunset',
  },
  thelab: {
    name: 'thelab',
    displayName: 'The Lab',
  },
};

export const getThemeDisplayName = (themeName: ThemeName): string => {
  return themes[themeName].displayName;
};
