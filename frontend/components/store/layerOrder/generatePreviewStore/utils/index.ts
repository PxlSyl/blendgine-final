import type { LayerImageData } from '../types';

import {
  isSupportedImageFormat,
  getPossibleImageNames as getPossibleNames,
} from '@/utils/imageUtils';

import { useLayerOrderStore } from '@/components/store/layerOrder/main';

export const hasImageExtension = (imageName: string): boolean => {
  return isSupportedImageFormat(imageName);
};

export const getPossibleImageNames = (imageName: string): string[] => {
  if (hasImageExtension(imageName)) {
    return [imageName];
  }
  return getPossibleNames(imageName);
};

export const createEmptyImage = (): LayerImageData => {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 1000;
  const url = canvas.toDataURL('image/png');

  return {
    url,
    isLoading: false,
    error: undefined,
  };
};

export const sortLayersByZIndex = (layers: string[]): string[] => {
  const layerOrderStore = useLayerOrderStore.getState();
  return [...layers].sort((a, b) => {
    const aConfig = layerOrderStore.rarityConfig[a];
    const bConfig = layerOrderStore.rarityConfig[b];
    const { currentTraits, activeSetId } = layerOrderStore;
    const currentSetId = activeSetId ?? 'set1';

    const aZIndex = aConfig?.traits?.[currentTraits[a]]?.sets?.[currentSetId]?.zIndex ?? 0;
    const bZIndex = bConfig?.traits?.[currentTraits[b]]?.sets?.[currentSetId]?.zIndex ?? 0;
    return aZIndex - bZIndex;
  });
};

export const createImageCacheKey = (
  selectedFolder: string,
  layerName: string,
  imageName: string
): string => {
  return `${selectedFolder}_${layerName}_${imageName}`;
};
