import { SpriteSheetData } from '@/types/cannevasTypes';

export const calculateTotalFrames = (spritesheets: SpriteSheetData[] | undefined): number => {
  return spritesheets?.reduce((sum, sheet) => sum + sheet.frameCount, 0) ?? 0;
};

export const getFirstSpritesheet = (
  spritesheets: SpriteSheetData[] | undefined
): SpriteSheetData | undefined => {
  return spritesheets?.[0];
};

export const hasSpritesheets = (spritesheets: SpriteSheetData[] | undefined): boolean => {
  return (spritesheets?.length ?? 0) > 0;
};
