import React, { useEffect, useRef } from 'react';

import type { PreviewImage } from '@/types/preview';

import { useProjectSetup } from '@/components/store/projectSetup/hook';
import { useLayerOrder } from '@/components/store/layerOrder/hook';

import { useImageConfigs } from '../../hooks/useImageConfigs';

export const AnimatedCanvas: React.FC<{
  images: PreviewImage[];
  width: number;
  height: number;
}> = React.memo(({ images, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { projectId } = useProjectSetup();
  const { framesByLayer, currentFrame } = useLayerOrder();

  const imageConfigs = useImageConfigs(images, framesByLayer, width, height);

  useEffect(() => {
    if (!canvasRef.current || !imageConfigs.length) {
      return;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingQuality = 'low';

    ctx.clearRect(0, 0, width, height);

    imageConfigs.forEach((config) => {
      if (!config?.spritesheets?.length) {
        return;
      }

      const { spritesheets, totalFrames } = config;
      const globalFrame = currentFrame % totalFrames;

      let totalFramesProcessed = 0;
      let [currentSpritesheet] = spritesheets;
      let localFrameNum = globalFrame;

      for (const sheet of spritesheets) {
        if (totalFramesProcessed + sheet.frameCount > globalFrame) {
          currentSpritesheet = sheet;
          localFrameNum = globalFrame - totalFramesProcessed;
          break;
        }
        totalFramesProcessed += sheet.frameCount;
      }

      const { cols, rows } = currentSpritesheet.layout;

      if (!cols || !rows) {
        return;
      }

      const col = localFrameNum % cols;
      const row = Math.floor(localFrameNum / cols);

      const sx = col * config.frameWidth;
      const sy = row * config.frameHeight;

      const scaleX = Math.floor(config.destWidth / config.frameWidth);
      const scaleY = Math.floor(config.destHeight / config.frameHeight);
      const scale = Math.min(scaleX, scaleY);

      const scaledWidth = config.frameWidth * scale;
      const scaledHeight = config.frameHeight * scale;

      const x = config.destX + (config.destWidth - scaledWidth) / 2;
      const y = config.destY + (config.destHeight - scaledHeight) / 2;

      ctx.save();
      if (config.opacity !== 1) {
        ctx.globalAlpha = config.opacity;
      }
      if (config.blendMode !== 'source-over') {
        ctx.globalCompositeOperation = config.blendMode as GlobalCompositeOperation;
      }

      if (currentSpritesheet.image?.complete) {
        ctx.drawImage(
          currentSpritesheet.image,
          sx,
          sy,
          config.frameWidth,
          config.frameHeight,
          x,
          y,
          scaledWidth,
          scaledHeight
        );
      }
      ctx.restore();
    });
  }, [currentFrame, imageConfigs, width, height, projectId]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full h-full"
      style={{ imageRendering: 'pixelated' }}
    />
  );
});

AnimatedCanvas.displayName = 'AnimatedCanvas';
