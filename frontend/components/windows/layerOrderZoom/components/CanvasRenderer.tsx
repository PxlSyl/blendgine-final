import React, { useEffect } from 'react';

interface ImageConfig {
  destWidth: number;
  destHeight: number;
  id: string;
  name: string;
  image: string;
  order: number;
  visible: boolean;
  isSpritesheet?: boolean;
  frameWidth?: number;
  frameHeight?: number;
  totalFrames?: number;
  spritesheetCols?: number;
  spritesheetRows?: number;
  opacity?: number;
  blendMode?: GlobalCompositeOperation;
}

interface CanvasRendererProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  imageConfigs: ImageConfig[];
  imageCache: { [src: string]: HTMLImageElement };
  imagesLoading: boolean;
  isAnimatedCollection: boolean;
  currentFrame: number;
  zoom: number;
}

export const CanvasRenderer: React.FC<CanvasRendererProps> = ({
  canvasRef,
  imageConfigs,
  imageCache,
  imagesLoading,
  isAnimatedCollection,
  currentFrame,
  zoom,
}) => {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const container = canvas.parentElement;
    if (container) {
      const rect = container.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height, 500);
      canvas.width = size;
      canvas.height = size;
    } else {
      canvas.width = 500;
      canvas.height = 500;
    }

    if (!imageConfigs.length || imagesLoading) {
      return;
    }

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) {
      return;
    }

    ctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingQuality = 'low';

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const allImagesLoaded = imageConfigs.every((config) => {
      const img = imageCache[config.image];
      if (!img) {
        return false;
      }
      return img.complete && img.naturalWidth > 0;
    });

    if (!allImagesLoaded) {
      return;
    }

    imageConfigs.forEach((config) => {
      const img = imageCache[config.image];
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.globalAlpha = config.opacity ?? 1;
        ctx.globalCompositeOperation = config.blendMode ?? 'source-over';

        if (
          isAnimatedCollection &&
          config.isSpritesheet &&
          config.frameWidth &&
          config.frameHeight &&
          config.spritesheetCols
        ) {
          const totalFrames = config.totalFrames ?? 1;
          const cols = config.spritesheetCols;
          const globalFrame = currentFrame % totalFrames;

          const row = Math.floor(globalFrame / cols);
          const col = globalFrame % cols;

          if (col < cols && row < (config.spritesheetRows ?? 1)) {
            const frameAspectRatio = config.frameWidth / config.frameHeight;
            const canvasAspectRatio = canvas.width / canvas.height;

            let destWidth, destHeight;
            if (frameAspectRatio > canvasAspectRatio) {
              destWidth = canvas.width * 0.8;
              destHeight = destWidth / frameAspectRatio;
            } else {
              destHeight = canvas.height * 0.8;
              destWidth = destHeight * frameAspectRatio;
            }

            const scaledWidth = destWidth * zoom;
            const scaledHeight = destHeight * zoom;

            const x = (canvas.width - scaledWidth) / 2;
            const y = (canvas.height - scaledHeight) / 2;

            ctx.drawImage(
              img,
              col * config.frameWidth,
              row * config.frameHeight,
              config.frameWidth,
              config.frameHeight,
              x,
              y,
              scaledWidth,
              scaledHeight
            );
          }
        } else {
          const imgAspectRatio = img.naturalWidth / img.naturalHeight;
          const canvasAspectRatio = canvas.width / canvas.height;

          let destWidth, destHeight;
          if (imgAspectRatio > canvasAspectRatio) {
            destWidth = canvas.width * 0.8;
            destHeight = destWidth / imgAspectRatio;
          } else {
            destHeight = canvas.height * 0.8;
            destWidth = destHeight * imgAspectRatio;
          }

          const scaledWidth = destWidth * zoom;
          const scaledHeight = destHeight * zoom;

          const x = (canvas.width - scaledWidth) / 2;
          const y = (canvas.height - scaledHeight) / 2;

          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        }
      }
    });

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }, [
    imageConfigs,
    zoom,
    imagesLoading,
    isAnimatedCollection,
    currentFrame,
    canvasRef,
    imageCache,
  ]);

  return null;
};
