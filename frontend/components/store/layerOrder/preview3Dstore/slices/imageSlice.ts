import { StateCreator } from 'zustand';
import { convertFileSrc } from '@tauri-apps/api/core';

import { api } from '@/services';

import type { SpriteSheetLayout } from '@/types/cannevasTypes';
import type { Preview3DState } from '../types';

import { setupTexture } from './utils';
import { useLayerPreviewStore } from '@/components/store/projectSetup/layerPreviewStore/index';
import { useProjectSetupStore } from '@/components/store/projectSetup/main';

type ImageSliceState = Pick<Preview3DState, 'framesByLayer' | 'textureManager'> & {
  projectId: string | null;
  spritesheetLayout: SpriteSheetLayout | null;
};

export interface ImageSlice {
  loadAnimatedImages: (layerName: string, traitName: string) => Promise<void>;
}

export const createImageSlice: StateCreator<ImageSliceState, [], [], ImageSlice> = (set, get) => ({
  projectId: null,
  spritesheetLayout: null,
  loadAnimatedImages: async (layerName: string, traitName: string) => {
    try {
      if (traitName === 'None') {
        return;
      }

      if (get().framesByLayer[layerName]?.[traitName]?.length > 0) {
        return;
      }

      const { projectId } = useLayerPreviewStore.getState();
      const { spritesheetLayout } = useProjectSetupStore.getState();

      set({
        projectId,
        spritesheetLayout,
      });

      if (!projectId) {
        console.error('No project ID available');
        return;
      }

      if (!spritesheetLayout) {
        console.error('No spritesheet layout available');
        return;
      }

      if (!spritesheetLayout.totalSheets || !spritesheetLayout.framesPerSheet) {
        console.error('Invalid spritesheet layout configuration:', spritesheetLayout);
        return;
      }

      const { framesByLayer } = get();
      if (!framesByLayer[layerName]) {
        framesByLayer[layerName] = {};
      }
      framesByLayer[layerName][traitName] = [];

      let sheetIndex = 0;
      let validFrames = 0;
      let consecutiveFailures = 0;
      const MAX_CONSECUTIVE_FAILURES = 3;

      const traitNameWithoutExt = traitName.replace(/\.(gif|png|webp|mp4|webm|mov|avi|mkv)$/i, '');

      while (
        sheetIndex < spritesheetLayout.totalSheets &&
        consecutiveFailures < MAX_CONSECUTIVE_FAILURES
      ) {
        try {
          const spritesheetName = `spritesheet_${sheetIndex}.png`;

          const imagePath = await api.getSpriteSheetImagePath(
            projectId,
            `${layerName}/${traitNameWithoutExt}`,
            spritesheetName
          );

          if (!imagePath) {
            consecutiveFailures++;
            if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
              console.warn(`Stopping after ${MAX_CONSECUTIVE_FAILURES} consecutive failures`);
              break;
            }
            sheetIndex++;
            continue;
          }

          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = convertFileSrc(imagePath);

          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
          });

          const texture = setupTexture(img);

          const { textureManager } = get();
          textureManager.addTexture(
            `${layerName}/${traitNameWithoutExt}/${spritesheetName}`,
            texture,
            1000 - sheetIndex
          );

          framesByLayer[layerName][traitName].push({
            texture,
            frameCount: spritesheetLayout.framesPerSheet,
            frameWidth: spritesheetLayout.frameWidth,
            frameHeight: spritesheetLayout.frameHeight,
            image: img,
            layout: spritesheetLayout,
            sheetIndex,
          });

          validFrames += spritesheetLayout.framesPerSheet;
          sheetIndex++;
          consecutiveFailures = 0;
        } catch (error) {
          console.error(
            `Failed to load spritesheet ${sheetIndex} for ${layerName}/${traitName}:`,
            error
          );
          consecutiveFailures++;
          if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
            console.warn(`Stopping after ${MAX_CONSECUTIVE_FAILURES} consecutive failures`);
            break;
          }
          sheetIndex++;
        }
      }

      if (validFrames === 0) {
        console.warn(
          `No valid frames loaded for ${layerName}/${traitName}. Total expected sheets: ${spritesheetLayout.totalSheets}`
        );
        delete framesByLayer[layerName][traitName];
      } else {
        set({ framesByLayer });
      }
    } catch (error) {
      console.error(`Error in loadAnimatedImages for ${layerName}/${traitName}:`, error);
    }
  },
});
