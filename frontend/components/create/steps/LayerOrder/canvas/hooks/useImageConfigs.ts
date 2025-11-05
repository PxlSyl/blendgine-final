import { useMemo } from 'react';
import type { PreviewImage } from '@/types/preview';
import { SpriteSheetData } from '@/types/cannevasTypes';
import { calculateTotalFrames } from '../utils/spritesheetUtils';

export const useImageConfigs = (
  sortedImages: PreviewImage[],
  framesByLayer: Record<string, Record<string, SpriteSheetData[]>>,
  width: number,
  height: number
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
  }, [sortedImages, framesByLayer, width, height]);
};
