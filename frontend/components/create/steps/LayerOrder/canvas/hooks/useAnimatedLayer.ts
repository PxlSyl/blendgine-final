import { useEffect } from 'react';
import { useSpritesheetData } from './useSpritesheetData';

export const useAnimatedLayer = (layerName: string, traitName: string) => {
  const { ensureLoaded, spritesheets, totalFrames, firstSpritesheet, hasSpritesheets } =
    useSpritesheetData(layerName, traitName);

  useEffect(() => {
    if (traitName !== 'None') {
      void ensureLoaded();
    }
  }, [layerName, traitName, ensureLoaded]);

  return {
    spritesheets,
    totalFrames,
    firstSpritesheet,
    isAnimated: hasSpritesheets,
    ensureLoaded,
  };
};
