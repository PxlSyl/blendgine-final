import { StateCreator } from 'zustand';

import type { PreviewCanvasStore } from '../types';
import type { PreviewImage } from '@/types/preview';
import { DEFAULT_BLEND_PROPERTIES, BlendMode } from '@/types/blendModes';
import { isSupportedImageFormat } from '@/utils/imageUtils';

import { getStores } from './utils';
import { useLayerOrderStore } from '../../main';
import { usePreview3DStore } from '../../preview3Dstore';
import { useProjectSetupStore } from '@/components/store/projectSetup/main';
import { useLayerPreviewStore } from '@/components/store/projectSetup/layerPreviewStore';

export const createImageLoadingSlice: StateCreator<
  PreviewCanvasStore,
  [],
  [],
  Pick<PreviewCanvasStore, 'loadImages'>
> = (set, get) => ({
  loadImages: async (selectedFolder: string, layers: string[], generationId: number) => {
    const { isAnimatedCollection } = useProjectSetupStore.getState();
    const { projectId } = useLayerPreviewStore.getState();
    const preview3DStore = usePreview3DStore.getState();

    if (preview3DStore.generationId !== generationId) {
      return;
    }

    try {
      const { images } = get();
      if (images.length > 0 && preview3DStore.generationId === generationId) {
        return;
      }

      const layerOrderStore = useLayerOrderStore.getState();
      const { activeSetId, currentTraits, rarityConfig } = layerOrderStore;
      const currentSetId = activeSetId ?? 'set1';
      const activeLayers = layers.filter((layer) => layerOrderStore.isLayerActive(layer));
      const newImages: PreviewImage[] = [];

      if (isAnimatedCollection && projectId) {
        for (const layerName of activeLayers) {
          const traitName = currentTraits[layerName];
          if (!traitName) {
            continue;
          }

          if (traitName === 'None') {
            continue;
          }

          const layerConfig = rarityConfig[layerName];
          if (!layerConfig?.traits) {
            continue;
          }
          const traitConfig = layerConfig.traits[traitName];
          if (!traitConfig?.sets?.[currentSetId]?.enabled) {
            continue;
          }

          const blendProps =
            traitConfig.sets[currentSetId]?.blend ||
            layerConfig?.defaultBlend ||
            DEFAULT_BLEND_PROPERTIES;

          const { projectId } = useLayerPreviewStore.getState();
          if (!projectId) {
            console.error('Project ID is missing for animated collection');
            return;
          }

          try {
            const existingFrames = preview3DStore.framesByLayer[layerName]?.[traitName];
            if (!existingFrames?.length) {
              await preview3DStore.loadAnimatedImages(layerName, traitName);
            }

            const updatedFrames = preview3DStore.framesByLayer[layerName]?.[traitName];
            if (updatedFrames?.length) {
              const [firstSpritesheet] = updatedFrames;
              if (firstSpritesheet?.image) {
                const currentImage: PreviewImage = {
                  element: firstSpritesheet.image,
                  layerName,
                  traitName,
                  blendMode: blendProps.mode,
                  opacity: blendProps.opacity,
                  hasAnimatedImages: true,
                };

                newImages.push(currentImage);
              }
            }
          } catch (error) {
            console.error(`Error loading spritesheet for ${layerName}/${traitName}:`, error);
          }
        }
      } else {
        const imageLoadPromises = activeLayers.map(
          async (layerName): Promise<PreviewImage | null> => {
            const traitName = currentTraits[layerName];
            if (!traitName) {
              return null;
            }

            if (traitName === 'None') {
              return null;
            }

            const layerConfig = rarityConfig[layerName];
            if (!layerConfig?.traits) {
              return null;
            }
            const traitConfig = layerConfig.traits[traitName];
            if (!traitConfig?.sets?.[currentSetId]?.enabled) {
              return null;
            }

            const hasExtension = isSupportedImageFormat(traitName);
            const traitNameWithExt = hasExtension ? traitName : `${traitName}.png`;
            const blendProps =
              traitConfig.sets[currentSetId]?.blend ||
              layerConfig?.defaultBlend ||
              DEFAULT_BLEND_PROPERTIES;

            const stores = await getStores();
            const imageData =
              stores.layerPreviewStore.loadedImages[`${layerName}/${traitNameWithExt}`];

            if (!imageData?.src) {
              return null;
            }

            const img = await new Promise<HTMLImageElement>((resolve, reject) => {
              const image = new Image();
              image.crossOrigin = 'anonymous';
              image.onload = () => resolve(image);
              image.onerror = reject;
              image.src = imageData.src ?? '';
            });

            return {
              element: img,
              layerName,
              traitName,
              blendMode: blendProps.mode as BlendMode,
              opacity: blendProps.opacity,
            };
          }
        );

        const loadedImages = await Promise.all(imageLoadPromises);
        const validImages = loadedImages.filter((img): img is PreviewImage => img !== null);

        for (const currentImage of validImages) {
          newImages.push(currentImage);
        }
      }

      set({ images: newImages, error: null });
    } catch (error) {
      console.error('Error loading images:', error);
      set({ error: error instanceof Error ? error.message : 'Unknown error occurred' });
    }
  },
});
