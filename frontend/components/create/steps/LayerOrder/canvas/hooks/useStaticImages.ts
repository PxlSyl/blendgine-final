import { useMemo } from 'react';
import type { PreviewImage } from '@/types/preview';
import type { RarityConfig } from '@/types/effect';

export interface StaticImageConfig {
  src: string;
  width: number;
  height: number;
  opacity: number;
  zIndex: number;
  key: string;
}

export const useStaticImages = (
  images: PreviewImage[],
  maxSize: number,
  rarityConfig: RarityConfig,
  currentSetId: string,
  layers: string[]
) => {
  return useMemo(() => {
    const configs: StaticImageConfig[] = [];

    images.forEach((img) => {
      const layerConfig = rarityConfig[img.layerName];
      const traitConfig = layerConfig?.traits?.[img.traitName];
      const opacity =
        traitConfig?.sets?.[currentSetId]?.blend?.opacity ??
        layerConfig?.defaultBlend?.opacity ??
        1;
      const zIndex = Number(
        traitConfig?.sets?.[currentSetId]?.zIndex ?? layers.indexOf(img.layerName) * 100
      );

      const aspectRatio = img.element.naturalWidth / img.element.naturalHeight;
      let width: number, height: number;

      if (aspectRatio > 1) {
        width = maxSize;
        height = maxSize / aspectRatio;
      } else {
        height = maxSize;
        width = maxSize * aspectRatio;
      }

      configs.push({
        src: img.element.src,
        width,
        height,
        opacity,
        zIndex,
        key: `${img.layerName}-${img.traitName}`,
      });
    });

    return configs;
  }, [images, maxSize, rarityConfig, currentSetId, layers]);
};
