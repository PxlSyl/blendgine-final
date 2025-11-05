import { useCallback } from 'react';
import { useLayerOrder } from '@/components/store/layerOrder/hook';

export const useSpritesheetData = (layerName: string, traitName: string) => {
  const { framesByLayer, loadAnimatedImages } = useLayerOrder();

  const spritesheets = framesByLayer[layerName]?.[traitName] || [];
  const totalFrames = spritesheets.reduce((sum, sheet) => sum + sheet.frameCount, 0);
  const [firstSpritesheet] = spritesheets;

  const ensureLoaded = useCallback(async () => {
    if (!spritesheets.length) {
      await loadAnimatedImages(layerName, traitName);
    }
  }, [layerName, traitName, spritesheets.length, loadAnimatedImages]);

  return {
    spritesheets,
    totalFrames,
    firstSpritesheet,
    ensureLoaded,
    hasSpritesheets: spritesheets.length > 0,
  };
};
