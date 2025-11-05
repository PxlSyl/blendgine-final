import type { TraitConfig } from '@/types/effect';

import { BLEND_MODES, DEFAULT_BLEND_PROPERTIES } from '@/types/blendModes';

export const capitalize = (str: string) => {
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const removeFileExtension = (filename: string): string => {
  return filename.substring(0, filename.lastIndexOf('.')) || filename;
};

export const resizeKeepingAspectRatio = (width: number, height: number, maxSize: number = 2000) => {
  if (width <= maxSize && height <= maxSize) {
    return { width, height };
  }

  const aspectRatio = width / height;

  if (width > height) {
    return {
      width: maxSize,
      height: Math.round(maxSize / aspectRatio),
    };
  } else {
    return {
      width: Math.round(maxSize * aspectRatio),
      height: maxSize,
    };
  }
};

export const joinPaths = (...paths: string[]): string => {
  return paths.join('/').replace(/\/+/g, '/');
};

export const formatBlendModeName = (name: string): string => {
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const getBlendModeName = (traitConfig: TraitConfig | undefined, activeSetId?: string) => {
  const currentSetId = activeSetId ?? 'set1';
  const mode = traitConfig?.sets[currentSetId]?.blend?.mode ?? DEFAULT_BLEND_PROPERTIES.mode;
  const blendName =
    Object.entries(BLEND_MODES).find(([, value]) => value === mode)?.[0] ?? 'Normal';
  return formatBlendModeName(blendName);
};

export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
