import type { FilterInstance, FilterName } from '@/types/effect';

import { LIVING_LANGUAGES } from '@/components/create/steps/FiltersSetup/Filters/ascii art components/asciiChartsetPresets';
import { RETRO_PRESETS } from '@/components/create/steps/FiltersSetup/Filters/retro palette components/retroPresets';

export const generateFilterId = (filterType: FilterName): string => {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 100000);
  return `${filterType}_${timestamp}_${randomNum}`;
};

export const createDefaultFilter = (filterType: FilterName): FilterInstance => {
  const baseFilter: FilterInstance = {
    id: generateFilterId(filterType),
    filterType,
    enabled: true,
    intensity: 10,
    includeInMetadata: true,
  };

  switch (filterType) {
    case 'border_Simple':
      return {
        ...baseFilter,
        color1: '#000000',
      };
    case 'border_Double':
      return {
        ...baseFilter,
        color1: '#000000',
        color2: '#FFFFFF',
      };
    case 'duotone':
      return {
        ...baseFilter,
        color1: '#FF6B6B',
        color2: '#4ECDC4',
      };
    case 'ascii_Art': {
      const [defaultPreset] = LIVING_LANGUAGES;
      return {
        ...baseFilter,
        color1: '#000000',
        color2: '#FFFFFF',
        charset: defaultPreset.charset,
        fontName: defaultPreset.font,
        fontSize: 12,
        blockSize: 8,
      };
    }
    case 'retro_Palette': {
      const [defaultPreset] = RETRO_PRESETS;
      return {
        ...baseFilter,
        palette: defaultPreset.colors,
        presetName: defaultPreset.name,
      };
    }
    case 'oil_Painting':
      return {
        ...baseFilter,
        radius: 35,
      };
    case 'dithering':
      return {
        ...baseFilter,
        ditherAlgorithm: 'floydsteinberg',
        filterBlendMode: 'mix',
        colorReduction: 16,
        diffusionThreshold: 128,
        diffusionDirection: 'lefttoright',

        bayerOptions: {
          matrixSize: 4,
        },
        sierraOptions: {
          variant: 'sierra',
        },
        clusteredDotOptions: {
          shape: 'round',
          matrixSize: 8,
        },
        halftoneOptions: {
          angle: 45,
          shape: 'circle',
          frequency: 150,
          overlap: 0.1,
        },
        customFactors: undefined,
      };
    case 'tint':
      return {
        ...baseFilter,
        tintColor: '#FF6B6B',
        tintIntensity: 50,
      };
    case 'bad_TV':
      return {
        ...baseFilter,
        badTvOptions: {
          scanlineIntensity: 5.0,
          glitchFrequency: 1.0,
          jitterStrength: 3.0,
          colorShiftStrength: 10.0,
          distortionStrength: 4.0,
          rollSpeed: 2.0,
          rollDirection: 'up',
        },
      };
    default:
      return baseFilter;
  }
};

export const getFilterDisplayName = (filterType: FilterName): string => {
  const displayNames: Record<FilterName, string> = {
    negate: 'Negate',
    vintage: 'Vintage',
    black_And_White: 'Black & White',
    clarity: 'Clarity',
    high_Contrast: 'High Contrast',
    pixelate: 'Pixelate',
    posterize: 'Posterize',
    bad_TV: 'Bad TV',
    color_Shift: 'Color Shift',
    duotone: 'Duotone',
    oil_Painting: 'Oil Painting',
    vignette: 'Vignette',
    border_Double: 'Double Border',
    border_Simple: 'Simple Border',
    sepia: 'Sepia',
    old_Vignette: 'Old Vignette',
    retro_Palette: 'Retro Palette',
    blue_Print: 'Blue Print',
    ascii_Art: 'ASCII Art',
    sharpen: 'Sharpen',
    emboss: 'Emboss',
    blur: 'Blur',
    edge_Detection: 'Edge Detection',
    bloom: 'Bloom',
    chromatic_Aberration: 'Chromatic Aberration',
    watercolor: 'Watercolor',
    paint_on_canvas: 'Paint on Canvas',
    dithering: 'Dithering',
    tint: 'Tint',
  };

  return displayNames[filterType] || filterType;
};
