import * as Effect from 'effect/Effect';
import { emit } from '@tauri-apps/api/event';
import { convertFileSrc } from '@tauri-apps/api/core';

import { api } from '@/services';

import type { LayerData, RarityData, SetInfo, ImageData } from './types';

import { removeFileExtension } from '@/utils/functionsUtils';

export const LayersviewServiceTag = Effect.Tag<'LayersviewService'>('LayersviewService');

export const makeLayersviewService = Effect.gen(function* (_) {
  const openLayersWindow = (layerName: string, traitName: string) =>
    Effect.gen(function* (_) {
      const layerData = yield* _(loadLayerImages(layerName, traitName));

      yield* _(
        Effect.tryPromise({
          try: () =>
            api.openLayersviewWindow({
              layer_name: layerData.layerName,
              trait_name: layerData.traitName,
            }),
          catch: (error) => new Error(`Failed to open window: ${String(error)}`),
        })
      );

      yield* _(Effect.sleep(300));

      yield* _(
        Effect.tryPromise({
          try: () =>
            emit('layersview-data-changed', {
              layerName: layerData.layerName,
              traitName: layerData.traitName,
              layerData,
            }),
          catch: (error) => new Error(`Failed to emit event: ${String(error)}`),
        })
      );
    });

  const closeWindow = () =>
    Effect.tryPromise({
      try: () => api.closeLayersviewWindow(),
      catch: (error) => new Error(`Failed to close window: ${String(error)}`),
    });

  const checkWindowStatus = () =>
    Effect.tryPromise({
      try: () => api.isLayersviewWindowOpen(),
      catch: (error) => new Error(`Failed to check window status: ${String(error)}`),
    });

  const loadLayerImages = (layerName: string, traitName: string) =>
    Effect.gen(function* (_) {
      if (!layerName || !traitName) {
        throw new Error('Invalid layer or trait name');
      }

      const sanitizedLayerName = removeFileExtension(layerName);
      const sanitizedTraitName = removeFileExtension(traitName);

      const projectSetup = yield* _(
        Effect.tryPromise({
          try: () => api.loadProjectSetup(),
          catch: (error) => new Error(`Failed to load project setup: ${String(error)}`),
        })
      );

      if (!projectSetup?.selectedFolder) {
        throw new Error('No project folder selected');
      }

      const layerOrderState = yield* _(Effect.tryPromise(() => api.loadLayerOrderState()));
      const availableSets: SetInfo[] = layerOrderState
        ? Object.entries(layerOrderState.sets).map(([id, set]) => ({
            id,
            name: set.customName ?? set.name,
          }))
        : [];

      const imageNames = yield* _(
        Effect.tryPromise({
          try: () => api.getLayerImageNames(projectSetup.selectedFolder, sanitizedLayerName),
          catch: (error) => new Error(`Failed to get layer images: ${String(error)}`),
        })
      );

      const allSetIds = ['global', ...availableSets.map((set) => set.id)];

      const images: ImageData[] = yield* _(
        Effect.all(
          imageNames.map((imageName) =>
            Effect.gen(function* (_) {
              const imagePath = yield* _(
                Effect.tryPromise({
                  try: () =>
                    api.getLayerImagePath(
                      projectSetup.selectedFolder,
                      sanitizedLayerName,
                      imageName
                    ),
                  catch: (error) =>
                    new Error(`Failed to get image path for ${imageName}: ${String(error)}`),
                })
              );

              const imageUrl: string = imagePath ? convertFileSrc(imagePath) : '';
              const rarityData: Record<string, RarityData> = {};

              for (const setId of allSetIds) {
                const data = yield* _(
                  Effect.tryPromise({
                    try: () =>
                      api.getRarityData(
                        sanitizedLayerName,
                        removeFileExtension(imageName),
                        setId === 'global' ? '' : setId
                      ),
                    catch: (error) =>
                      new Error(
                        `Failed to get rarity data for ${imageName} and set ${setId}: ${String(error)}`
                      ),
                  })
                );
                rarityData[setId] = data;
              }

              const imageEntry: ImageData = {
                name: imageName,
                url: imageUrl || '',
                rarity: rarityData,
              };
              return imageEntry;
            })
          )
        )
      );

      const filteredImages = images.filter((img) => img.url !== null);

      const matchingIndex = filteredImages.findIndex(
        (img) => removeFileExtension(img.name).toLowerCase() === sanitizedTraitName.toLowerCase()
      );

      const layerData: LayerData = {
        layerName: sanitizedLayerName,
        traitName: sanitizedTraitName,
        images: filteredImages,
        currentIndex: matchingIndex !== -1 ? matchingIndex : 0,
        navigationMode: matchingIndex !== -1 ? 'target' : 'manual',
        targetIndex: matchingIndex !== -1 ? matchingIndex : undefined,
        availableSets,
      };

      return layerData;
    });

  const getAllAvailableLayersAndTraits = () =>
    Effect.gen(function* (_) {
      const projectSetup = yield* _(
        Effect.tryPromise({
          try: () => api.loadProjectSetup(),
          catch: (error) => new Error(`Failed to load project setup: ${String(error)}`),
        })
      );

      if (!projectSetup?.selectedFolder) {
        throw new Error('No project folder selected');
      }

      const layers = yield* _(
        Effect.tryPromise({
          try: () => api.readLayers(projectSetup.selectedFolder),
          catch: (error) => new Error(`Failed to get layers: ${String(error)}`),
        })
      );

      const traitsByLayer: Record<string, string[]> = {};
      for (const layer of layers) {
        const traits = yield* _(
          Effect.tryPromise({
            try: () => api.readTraits(projectSetup.selectedFolder, layer),
            catch: (error) =>
              new Error(`Failed to get traits for layer ${layer}: ${String(error)}`),
          })
        );
        traitsByLayer[layer] = traits;
      }

      return { layers, traitsByLayer };
    });

  return yield* _(
    Effect.succeed({
      openLayersWindow,
      closeWindow,
      checkWindowStatus,
      loadLayerImages,
      getAllAvailableLayersAndTraits,
    })
  );
});
