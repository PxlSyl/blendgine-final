import type { SpriteSheetLayout } from '@/types/cannevasTypes';

export const getStores = async () => {
  const [{ useLayerPreviewStore }] = await Promise.all([
    import('@/components/store/projectSetup/layerPreviewStore'),
  ]);

  return {
    layerPreviewStore: useLayerPreviewStore.getState(),
  };
};
export function calculateSpriteSheetLayout(width: number, height: number): SpriteSheetLayout {
  const MAX_TEXTURE_SIZE = 8192;
  const aspectRatio = width / height;
  let cols: number;
  let rows: number;

  if (aspectRatio > 1) {
    cols = Math.floor(Math.sqrt(width / height));
    rows = Math.ceil(height / (width / cols));
  } else {
    rows = Math.floor(Math.sqrt(height / width));
    cols = Math.ceil(width / (height / rows));
  }

  const frameWidth = Math.floor(width / cols);
  const frameHeight = Math.floor(height / rows);
  const frameCount = cols * rows;

  const maxFramesPerRow = Math.floor(MAX_TEXTURE_SIZE / frameWidth);
  const maxFramesPerCol = Math.floor(MAX_TEXTURE_SIZE / frameHeight);
  const maxFramesPerSheet = maxFramesPerRow * maxFramesPerCol;
  const totalSheets = Math.ceil(frameCount / maxFramesPerSheet);
  const framesPerSheet = totalSheets === 1 ? frameCount : maxFramesPerSheet;

  return {
    cols: Math.min(cols, maxFramesPerRow),
    rows: Math.min(rows, maxFramesPerCol),
    frameWidth,
    frameHeight,
    totalSheets,
    framesPerSheet,
    totalFrames: frameCount,
  };
}
