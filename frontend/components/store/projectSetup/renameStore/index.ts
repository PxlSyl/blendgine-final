import { create } from 'zustand';
import * as Effect from 'effect/Effect';

import { api } from '@/services';

import type { TextureCache } from '@/components/store/layerOrder/preview3Dstore/types';
import type { RenameStoreImplementation } from './types';

import { RenameRequestSchema } from '@/schemas/effect/projectSetup/renameStore';
import { safeValidate } from '@/utils/effect/effectValidation';

import { useProjectSetupStore } from '@/components/store/projectSetup/main';
import { useLayerOrderStore } from '@/components/store/layerOrder/main';
import { useLayerPreviewStore } from '@/components/store/projectSetup/layerPreviewStore';
import { usePreviewCanvasStore } from '@/components/store/layerOrder/previewCanvasStore';
import { usePreview3DStore } from '@/components/store/layerOrder/preview3Dstore';
import { useGeneratePreviewStore } from '@/components/store/layerOrder/generatePreviewStore';

export const useRenameStore = create<RenameStoreImplementation>(() => {
  return {
    renameLayerOrTrait: (
      oldName: string,
      newName: string,
      isLayer: boolean,
      currentLayer?: string
    ) => {
      const validationResult = safeValidate(RenameRequestSchema, {
        oldName,
        newName,
        type: isLayer ? 'layer' : 'trait',
        parentLayer: currentLayer,
      });

      if (!validationResult.success) {
        return Effect.fail(
          new Error(`Invalid rename request: ${validationResult.errors?.[0] ?? 'Unknown error'}`)
        );
      }

      const { selectedFolder } = useProjectSetupStore.getState();
      if (!selectedFolder) {
        return Effect.fail(new Error('No folder selected'));
      }

      let oldPath: string;
      let newPath: string;

      if (isLayer) {
        oldPath = oldName;
        newPath = newName;
      } else {
        oldPath = `${currentLayer}/${oldName}`;
        newPath = `${currentLayer}/${newName}`;
      }

      api
        .renameItem(selectedFolder, oldPath, newPath)
        .then((result) => {
          if (!result.success) {
            console.error('Failed to rename item on file system:', result.error);
            return;
          }

          if (isLayer) {
            const layerOrderStore = useLayerOrderStore.getState();
            const rarityConfig = { ...layerOrderStore.rarityConfig };

            if (rarityConfig[oldName]) {
              rarityConfig[newName] = { ...rarityConfig[oldName] };

              if (rarityConfig[newName].sets) {
                Object.keys(rarityConfig[newName].sets || {}).forEach((setId) => {
                  if (rarityConfig[oldName]?.sets?.[setId] && rarityConfig[newName].sets?.[setId]) {
                    rarityConfig[newName].sets[setId].active =
                      rarityConfig[oldName].sets[setId].active;
                  }
                });
              }

              delete rarityConfig[oldName];

              const sets = { ...layerOrderStore.sets };
              Object.keys(sets).forEach((setId) => {
                if (sets[setId]) {
                  sets[setId] = {
                    ...sets[setId],
                    layers: sets[setId].layers.map((layer) =>
                      layer === oldName ? newName : layer
                    ),
                  };
                }
              });

              const expandedLayers = { ...layerOrderStore.expandedLayers };
              Object.keys(expandedLayers).forEach((setId) => {
                if (expandedLayers[setId]?.[oldName] !== undefined) {
                  expandedLayers[setId][newName] = expandedLayers[setId][oldName];
                  delete expandedLayers[setId][oldName];
                }
              });

              const currentTraits = { ...layerOrderStore.currentTraits };
              if (currentTraits[oldName] !== undefined) {
                currentTraits[newName] = currentTraits[oldName];
                delete currentTraits[oldName];
              }

              const layerImages = { ...layerOrderStore.layerImages };
              Object.keys(layerImages).forEach((key) => {
                if (key.startsWith(`${oldName}/`)) {
                  const newKey = key.replace(`${oldName}/`, `${newName}/`);
                  layerImages[newKey] = layerImages[key];
                  delete layerImages[key];
                }
              });

              const generatePreviewStore = useGeneratePreviewStore.getState();
              if (selectedFolder) {
                const imageCache = { ...generatePreviewStore.imageCache };
                Object.keys(imageCache).forEach((cacheKey) => {
                  const parts = cacheKey.split('_');
                  if (parts.length >= 3) {
                    const [folderPart, layerPart] = parts;
                    const imagePart = parts.slice(2).join('_');

                    if (layerPart === oldName) {
                      const newCacheKey = `${folderPart}_${newName}_${imagePart}`;
                      const cachedValue = imageCache[cacheKey] as unknown;
                      if (cachedValue !== undefined) {
                        (imageCache as Record<string, unknown>)[newCacheKey] = cachedValue;
                        delete imageCache[cacheKey];
                      }
                    }
                  }
                });

                useGeneratePreviewStore.setState((state) => ({
                  ...state,
                  imageCache,
                }));
              }

              useLayerOrderStore.setState((state) => ({
                ...state,
                rarityConfig,
                sets,
                expandedLayers,
                layerImages,
                currentTraits,
                lastUpdate: performance.now(),
              }));

              useLayerPreviewStore.getState().updateLayerName(oldName, newName);
              useLayerPreviewStore.getState().forceUpdate();

              const previewCanvasStore = usePreviewCanvasStore.getState();

              const updatedImages = previewCanvasStore.images.map((image) =>
                image.layerName === oldName ? { ...image, layerName: newName } : image
              );

              usePreviewCanvasStore.setState((state) => ({
                ...state,
                images: updatedImages,
              }));

              const preview3DStore = usePreview3DStore.getState();

              const framesByLayer = { ...preview3DStore.framesByLayer };
              if (framesByLayer[oldName]) {
                framesByLayer[newName] = framesByLayer[oldName];
                delete framesByLayer[oldName];
              }

              const textureManager = { ...preview3DStore.textureManager };
              const newCache: TextureCache = {};

              Object.keys(textureManager.cache).forEach((key) => {
                if (key.startsWith(`${oldName}/`)) {
                  const newKey = key.replace(`${oldName}/`, `${newName}/`);
                  newCache[newKey] = textureManager.cache[key];
                } else {
                  newCache[key] = textureManager.cache[key];
                }
              });

              textureManager.cache = newCache;

              const { meshes } = preview3DStore;
              meshes.forEach((mesh) => {
                if (mesh.userData.layerName === oldName) {
                  mesh.userData.layerName = newName;
                }
              });

              usePreview3DStore.setState((state) => ({
                ...state,
                framesByLayer,
                textureManager,
              }));

              void usePreview3DStore.getState().triggerGeneration();
              useLayerOrderStore.getState().forceUpdate();

              Promise.all([
                useLayerOrderStore.getState().saveState(),
                useLayerOrderStore.getState().saveRarityConfig(),
              ]).catch((error) => {
                console.error('Error saving configurations:', error);
              });
            }
          } else if (currentLayer) {
            const oldNameNoExt = oldName.replace(new RegExp(`\\.(png|webp|gif)$`, 'i'), '');
            const newNameNoExt = newName.replace(new RegExp(`\\.(png|webp|gif)$`, 'i'), '');

            const layerOrderStore = useLayerOrderStore.getState();
            const rarityConfig = { ...layerOrderStore.rarityConfig };

            if (rarityConfig[currentLayer]?.traits?.[oldNameNoExt]) {
              const layerConfig = { ...rarityConfig[currentLayer] };
              const traits = { ...layerConfig.traits };

              traits[newNameNoExt] = { ...traits[oldNameNoExt] };
              delete traits[oldNameNoExt];

              layerConfig.traits = traits;
              rarityConfig[currentLayer] = layerConfig;

              const currentTraits = { ...layerOrderStore.currentTraits };
              if (currentTraits[currentLayer] === oldNameNoExt) {
                currentTraits[currentLayer] = newNameNoExt;
              }

              const forcedTraits = { ...layerOrderStore.forcedTraits };
              Object.keys(forcedTraits).forEach((setId) => {
                if (forcedTraits[setId] && forcedTraits[setId][currentLayer] === oldNameNoExt) {
                  forcedTraits[setId] = {
                    ...forcedTraits[setId],
                    [currentLayer]: newNameNoExt,
                  };
                }
              });

              const generatePreviewStore = useGeneratePreviewStore.getState();
              if (selectedFolder) {
                const imageCache = { ...generatePreviewStore.imageCache };
                Object.keys(imageCache).forEach((cacheKey) => {
                  const parts = cacheKey.split('_');
                  if (parts.length >= 3) {
                    const [folderPart, layerPart] = parts;
                    const imagePart = parts.slice(2).join('_');

                    if (layerPart === currentLayer) {
                      const imageNoExt = imagePart.replace(
                        new RegExp(`\\.(png|webp|gif)$`, 'i'),
                        ''
                      );
                      if (imageNoExt === oldNameNoExt) {
                        const extension =
                          imagePart.match(new RegExp(`\\.(png|webp|gif)$`, 'i'))?.[0] ?? '';
                        const newCacheKey = `${folderPart}_${layerPart}_${newNameNoExt}${extension}`;
                        const cachedValue = imageCache[cacheKey] as unknown;
                        if (cachedValue !== undefined) {
                          (imageCache as Record<string, unknown>)[newCacheKey] = cachedValue;
                          delete imageCache[cacheKey];
                        }
                      }
                    }
                  }
                });

                useGeneratePreviewStore.setState((state) => ({
                  ...state,
                  imageCache,
                }));
              }

              useLayerOrderStore.setState((state) => ({
                ...state,
                rarityConfig,
                currentTraits,
                forcedTraits,
                lastUpdate: performance.now(),
              }));

              useLayerOrderStore.getState().forceUpdate();
              useLayerPreviewStore
                .getState()
                .updateTraitName(currentLayer, oldNameNoExt, newNameNoExt);

              useLayerPreviewStore.getState().forceUpdate();
              void useGeneratePreviewStore.getState().generatePreview();

              Promise.all([
                useLayerOrderStore.getState().saveState(),
                useLayerOrderStore.getState().saveRarityConfig(),
              ]).catch((error) => {
                console.error('Error saving configurations:', error);
              });
            }
          }
        })
        .catch((error) => {
          console.error('Error during rename operation:', error);
        });

      return Effect.succeed(void 0);
    },
  };
});
