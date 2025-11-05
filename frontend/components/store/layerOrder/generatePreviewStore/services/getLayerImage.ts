import { Effect, pipe } from 'effect';
import { convertFileSrc } from '@tauri-apps/api/core';

import { api } from '@/services';
import { useProjectSetupStore } from '@/components/store/projectSetup/main';
import { useLayerPreviewStore } from '@/components/store/projectSetup/layerPreviewStore';

import type { LayerImageData } from '../types';

import { createEmptyImage, getPossibleImageNames, createImageCacheKey } from '../utils';

export const getLayerImageEffect = (params: {
  selectedFolder: string;
  layerName: string;
  imageName: string;
  imageCache: Record<string, LayerImageData>;
}) =>
  pipe(
    Effect.gen(function* (_) {
      const { selectedFolder, layerName, imageName, imageCache } = params;

      if (imageName === 'None') {
        return createEmptyImage();
      }

      const imageNames = getPossibleImageNames(imageName);
      const cacheKey = createImageCacheKey(selectedFolder, layerName, imageName);

      if (imageCache[cacheKey]) {
        return imageCache[cacheKey];
      }

      const { isAnimatedCollection } = useProjectSetupStore.getState();
      const { projectId } = useLayerPreviewStore.getState();

      if (isAnimatedCollection && projectId) {
        try {
          const traitNameWithoutExt = imageName.replace(/\.(gif|png|webp)$/i, '');
          const spritesheetName = 'spritesheet_0.png';

          const imagePath = yield* _(
            Effect.promise(() =>
              api.getSpriteSheetImagePath(
                projectId,
                `${layerName}/${traitNameWithoutExt}`,
                spritesheetName
              )
            )
          );

          if (imagePath) {
            const imageUrl = convertFileSrc(imagePath);

            const newImage: LayerImageData = {
              url: imageUrl,
              isLoading: false,
              error: undefined,
            };

            return newImage;
          }
        } catch (e) {
          console.warn(
            `Failed to load spritesheet for animated collection: ${layerName}/${imageName}`,
            e
          );
        }
      } else if (!isAnimatedCollection && projectId) {
        for (const imageNameWithExt of imageNames) {
          try {
            const imagePath = yield* _(
              Effect.promise(() =>
                api.getLayerImagePath(selectedFolder, layerName, imageNameWithExt)
              )
            );

            if (!imagePath) {
              continue;
            }

            const imageUrl = convertFileSrc(imagePath);

            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = imageUrl;

            const newImage: LayerImageData = {
              url: imageUrl,
              imageElement: img,
              isLoading: false,
              error: undefined,
            };

            return newImage;
          } catch {
            continue;
          }
        }
      }

      return Effect.fail(
        new Error(
          `Failed to load image ${imageName} in any supported format for layer ${layerName}`
        )
      );
    }),
    Effect.map((result) => result as LayerImageData)
  );
