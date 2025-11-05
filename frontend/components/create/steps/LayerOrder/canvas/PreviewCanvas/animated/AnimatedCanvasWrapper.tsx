import React, { useMemo } from 'react';
import type { PreviewImage } from '@/types/preview';
import type { RarityConfig } from '@/types/effect';
import { AnimatedCanvas } from './AnimatedCanvas';
import { useLayerOrder } from '@/components/store/layerOrder/hook';
import { getFirstSpritesheet } from '../../utils/spritesheetUtils';

interface AnimatedCanvasWrapperProps {
  sortedImages: PreviewImage[];
  rarityConfig: RarityConfig;
  currentSetId: string;
  isAnimatedCollection: boolean;
  maxSize: number;
}

export const AnimatedCanvasWrapper: React.FC<AnimatedCanvasWrapperProps> = ({
  sortedImages,
  rarityConfig,
  currentSetId,
  isAnimatedCollection,
  maxSize,
}) => {
  const { framesByLayer } = useLayerOrder();

  const renderImages = useMemo(() => {
    return sortedImages.map((img, index) => {
      const layerConfig = rarityConfig[img.layerName];
      const traitConfig = layerConfig?.traits?.[img.traitName];
      const zIndex = traitConfig?.sets?.[currentSetId]?.zIndex ?? index * 100;

      const spritesheets = framesByLayer[img.layerName]?.[img.traitName];
      const isSprite = isAnimatedCollection || img.hasAnimatedImages;
      const firstSpritesheet = getFirstSpritesheet(spritesheets);

      if (isSprite && firstSpritesheet) {
        const frameAspectRatio = firstSpritesheet.frameWidth / firstSpritesheet.frameHeight;
        const containerAspectRatio = maxSize / maxSize;

        let finalWidth: number, finalHeight: number;

        if (frameAspectRatio > containerAspectRatio) {
          finalWidth = maxSize;
          finalHeight = maxSize / frameAspectRatio;
        } else {
          finalWidth = maxSize * frameAspectRatio;
          finalHeight = maxSize;
        }

        return (
          <div
            key={`animated-${img.layerName}-${img.traitName}-${zIndex}`}
            className="absolute inset-0 flex items-center justify-center"
            style={{ zIndex }}
          >
            <AnimatedCanvas
              images={sortedImages.map((img, index) => {
                const layerConfig = rarityConfig[img.layerName];
                const traitConfig = layerConfig?.traits?.[img.traitName];
                const blendConfig =
                  traitConfig?.sets?.[currentSetId]?.blend ?? layerConfig?.defaultBlend;
                return {
                  ...img,
                  blendMode: blendConfig?.mode ?? 'source-over',
                  opacity: blendConfig?.opacity ?? 1,
                  zIndex: traitConfig?.sets?.[currentSetId]?.zIndex ?? index * 100,
                };
              })}
              width={finalWidth}
              height={finalHeight}
            />
          </div>
        );
      }

      return null;
    });
  }, [sortedImages, rarityConfig, currentSetId, isAnimatedCollection, maxSize, framesByLayer]);

  if (!isAnimatedCollection) {
    return null;
  }

  return <>{renderImages}</>;
};
