export interface BlendProperties {
  mode: BlendMode;
  opacity: number;
}

export const BLEND_MODES = {
  'source-over': 'source-over',
  'source-in': 'source-in',
  'source-out': 'source-out',
  'source-atop': 'source-atop',
  'destination-over': 'destination-over',
  'destination-in': 'destination-in',
  'destination-out': 'destination-out',
  'destination-atop': 'destination-atop',
  lighter: 'lighter',
  copy: 'copy',
  xor: 'xor',
  multiply: 'multiply',
  screen: 'screen',
  overlay: 'overlay',
  darken: 'darken',
  lighten: 'lighten',
  'color-dodge': 'color-dodge',
  'color-burn': 'color-burn',
  'hard-light': 'hard-light',
  'soft-light': 'soft-light',
  difference: 'difference',
  exclusion: 'exclusion',
  hue: 'hue',
  saturation: 'saturation',
  color: 'color',
  luminosity: 'luminosity',
} as const;

export type BlendMode = keyof typeof BLEND_MODES;

export const FILTER_BLEND_MODES: Record<FilterBlendMode, string> = {
  mix: 'Mix',
  hard: 'Hard',
  multiply: 'Multiply',
  screen: 'Screen',
  overlay: 'Overlay',
  difference: 'Difference',
  add: 'Add',
  darken: 'Darken',
  lighten: 'Lighten',
};

export type FilterBlendMode =
  | 'mix'
  | 'hard'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'difference'
  | 'add'
  | 'darken'
  | 'lighten';

export const DEFAULT_BLEND_PROPERTIES: BlendProperties = {
  mode: 'source-over',
  opacity: 1,
};

export const VALID_BLEND_MODES = Object.keys(BLEND_MODES) as BlendMode[];
