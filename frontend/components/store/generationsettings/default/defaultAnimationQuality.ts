import type { AnimationQualityConfig } from '@/types/effect';

export const defaultAnimationQuality: AnimationQualityConfig = {
  optimize: true,
  formatSpecificSettings: {
    webm: {
      quality: 7,
      autoloop: true,
      interpolation: {
        enabled: false,
        method: 'LUCAS_KANADE',
        factor: 1,
      },
    },
    mp4: {
      quality: 7,
      autoloop: true,
      interpolation: {
        enabled: false,
        method: 'LUCAS_KANADE',
        factor: 1,
      },
    },
    webp: {
      lossless: true,
      quality: 100,
      method: 6,
      autoloop: true,
      interpolation: {
        enabled: false,
        method: 'LUCAS_KANADE',
        factor: 1,
      },
    },
    gif: {
      colors: 256,
      dithering: true,
      ditheringMethod: 'FLOYDSTEINBERG',
      autoloop: true,
      interpolation: {
        enabled: false,
        method: 'LUCAS_KANADE',
        factor: 1,
      },
    },
  },
};
