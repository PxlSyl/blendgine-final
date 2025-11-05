import { useMemo } from 'react';
import type { RarityConfig, SetInfo } from '@/types/effect';
import type { PreviewImage } from '@/types/preview';

export interface ImageWithElement extends PreviewImage {
  element: HTMLImageElement;
  hasAnimatedImages?: boolean;
}

interface UseImageSortingProps {
  images: (PreviewImage | ImageWithElement)[];
  isGenerating?: boolean;
  sets?: Record<string, SetInfo>;
  currentSetId: string;
  rarityConfig: RarityConfig;
  orderedLayers?: string[];
  handleEqualZIndex?: (a: PreviewImage, b: PreviewImage, orderedLayers: string[]) => number;
}

export const useImageSorting = ({
  images,
  isGenerating = false,
  sets,
  currentSetId,
  rarityConfig,
  orderedLayers,
  handleEqualZIndex,
}: UseImageSortingProps) => {
  return useMemo(() => {
    if (isGenerating) {
      return [];
    }
    if (!rarityConfig) {
      return [...images];
    }

    const layers = orderedLayers ?? sets?.[currentSetId]?.layers ?? [];

    return [...images].sort((a, b) => {
      const aLayerConfig = rarityConfig[a.layerName];
      const bLayerConfig = rarityConfig[b.layerName];

      const aTraitConfig = aLayerConfig?.traits?.[a.traitName];
      const bTraitConfig = bLayerConfig?.traits?.[b.traitName];

      const aZIndex = Number(
        aTraitConfig?.sets?.[currentSetId]?.zIndex ?? layers.indexOf(a.layerName) * 100
      );
      const bZIndex = Number(
        bTraitConfig?.sets?.[currentSetId]?.zIndex ?? layers.indexOf(b.layerName) * 100
      );

      if (isNaN(aZIndex) && isNaN(bZIndex)) {
        return 0;
      }
      if (isNaN(aZIndex)) {
        return 1;
      }
      if (isNaN(bZIndex)) {
        return -1;
      }

      if (aZIndex === bZIndex) {
        if (handleEqualZIndex) {
          return handleEqualZIndex(a, b, layers);
        }
        return layers.indexOf(a.layerName) - layers.indexOf(b.layerName);
      }

      return aZIndex - bZIndex;
    });
  }, [images, isGenerating, sets, currentSetId, rarityConfig, orderedLayers, handleEqualZIndex]);
};
