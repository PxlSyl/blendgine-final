import React, { useRef, useEffect } from 'react';
import type { PreviewImage } from '@/types/preview';
import type { RarityConfig } from '@/types/effect';

interface StaticCanvasProps {
  sortedImages: PreviewImage[];
  rarityConfig: RarityConfig;
  currentSetId: string;
  isAnimatedCollection: boolean;
  maxSize: number;
}

export const StaticCanvas: React.FC<StaticCanvasProps> = ({
  sortedImages,
  rarityConfig,
  currentSetId,
  isAnimatedCollection,
  maxSize,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingQuality = 'low';

    canvas.width = maxSize;
    canvas.height = maxSize;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const allImagesLoaded = sortedImages.every(
      (img) => img.element && img.element.complete && img.element.naturalWidth > 0
    );

    if (!allImagesLoaded) {
      return;
    }

    sortedImages.forEach((img) => {
      const layerConfig = rarityConfig[img.layerName];
      const traitConfig = layerConfig?.traits?.[img.traitName];
      const blendConfig = traitConfig?.sets?.[currentSetId]?.blend ?? layerConfig?.defaultBlend;

      if (!img.element?.complete) {
        return;
      }

      const imgElement = img.element;
      const imgAspectRatio = imgElement.naturalWidth / imgElement.naturalHeight;
      const canvasAspectRatio = maxSize / maxSize;

      let destWidth, destHeight;
      if (imgAspectRatio > canvasAspectRatio) {
        destWidth = maxSize * 0.8;
        destHeight = destWidth / imgAspectRatio;
      } else {
        destHeight = maxSize * 0.8;
        destWidth = destHeight * imgAspectRatio;
      }

      const x = (maxSize - destWidth) / 2;
      const y = (maxSize - destHeight) / 2;

      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.imageSmoothingQuality = 'low';
      ctx.globalAlpha = blendConfig?.opacity ?? 1;
      ctx.globalCompositeOperation = (blendConfig?.mode ??
        'source-over') as GlobalCompositeOperation;

      ctx.drawImage(imgElement, x, y, destWidth, destHeight);
      ctx.restore();
    });
  }, [sortedImages, rarityConfig, currentSetId, maxSize]);

  if (isAnimatedCollection) {
    return null;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={maxSize}
        height={maxSize}
        style={{
          width: `${maxSize}px`,
          height: `${maxSize}px`,
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
};
