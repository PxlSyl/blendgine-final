import { useMemo } from 'react';
import type { PreviewImage } from '@/types/preview';
import type { RarityConfig } from '@/types/effect';
import { SpriteSheetData } from '@/types/cannevasTypes';
import { calculateTotalFrames } from '../utils/spritesheetUtils';

export const useImageConfigs = (
  sortedImages: PreviewImage[],
  framesByLayer: Record<string, Record<string, SpriteSheetData[]>>,
  width: number,
  height: number,
  rarityConfig?: RarityConfig,
  currentSetId?: string
) => {
  return useMemo(() => {
    return sortedImages
      .map((image) => {
        const spritesheets = framesByLayer[image.layerName]?.[image.traitName];
        if (!spritesheets?.[0]) {
          return null;
        }

        const [currentSpritesheet] = spritesheets;
        const { frameWidth, frameHeight } = currentSpritesheet;
        const frameAspectRatio = frameWidth / frameHeight;
        const canvasAspectRatio = width / height;

        let destWidth = width;
        let destHeight = height;
        let destX = 0;
        let destY = 0;

        if (frameAspectRatio > canvasAspectRatio) {
          destHeight = width / frameAspectRatio;
          destY = (height - destHeight) / 2;
        } else {
          destWidth = height * frameAspectRatio;
          destX = (width - destWidth) / 2;
        }

        let offsetX = 0;
        let offsetY = 0;
        if (rarityConfig && currentSetId) {
          const layerConfig = rarityConfig[image.layerName];
          const traitConfig = layerConfig?.traits?.[image.traitName];
          const setConfig = traitConfig?.sets?.[currentSetId] ?? traitConfig?.sets?.['default'];
          offsetX = setConfig?.offsetX ?? 0;
          offsetY = setConfig?.offsetY ?? 0;
        }

        destX += offsetX;
        destY += offsetY;

        const totalFrames = calculateTotalFrames(spritesheets);

        return {
          spritesheets,
          frameWidth,
          frameHeight,
          destX,
          destY,
          destWidth,
          destHeight,
          opacity: image.opacity,
          blendMode: image.blendMode,
          layerName: image.layerName,
          traitName: image.traitName,
          totalFrames,
        };
      })
      .filter(Boolean);
  }, [sortedImages, framesByLayer, width, height, rarityConfig, currentSetId]);
};
