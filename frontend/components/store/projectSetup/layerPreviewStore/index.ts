import { create } from 'zustand';
import * as S from '@effect/schema/Schema';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import { convertFileSrc } from '@tauri-apps/api/core';

import { api } from '@/services';

import type {
  LayerImages,
  LayerPreviewState,
  ImageEntry,
  BlendProperties,
  Dimensions,
} from '@/types/effect';
import { DEFAULT_BLEND_PROPERTIES } from '@/types/blendModes';
import type { LayerPreviewStore } from './types';

import {
  LayerImagesSchema,
  LayerPreviewStateSchema,
  ImageNameListSchema,
  ImageEntrySchema,
  DimensionsSchema,
} from '@/schemas/effect/projectSetup/previews';

import { removeFileExtension } from '../../../../utils/functionsUtils';
import {
  blendPropertiesCache,
  fileExistsCache,
  getBlendPropertiesForTrait,
  isImageFile,
  processedFramesCache,
  processFrames,
} from './utils';

import { useRarityStore } from '../../rarityStore/main';
import { useProjectSetupStore } from '../main';
import { createInitialState } from './initialState';

export const useLayerPreviewStore = create<LayerPreviewStore>((set, get) => {
  const setState = (fn: (state: LayerPreviewStore) => Partial<LayerPreviewState>) => {
    const currentState = get();
    const updates = fn(currentState);

    const newState = {
      ...currentState,
      ...updates,
    };

    try {
      const result = S.decodeSync(LayerPreviewStateSchema)(newState) as LayerPreviewState;
      set((state) => ({ ...state, ...result }));
    } catch (error) {
      console.warn('State validation error:', error);
      set((state) => ({ ...state, ...updates }));
    }
  };

  return {
    ...createInitialState(),

    resetLayerPreviewStore: async () => {
      const resetEffect = Effect.gen(function* (_) {
        fileExistsCache.clear();
        blendPropertiesCache.clear();
        processedFramesCache.clear();

        if (get().projectId) {
          yield* _(Effect.tryPromise(() => get().cleanupFrames()));
        }

        const initialState = createInitialState();
        set({ ...initialState, projectId: '' });
      });

      await Effect.runPromise(
        pipe(
          resetEffect,
          Effect.catchAll((error) =>
            Effect.succeed(() => {
              console.error('Error resetting layer preview store:', error);
            })
          )
        )
      );
    },

    setLayerImages: (layerImages: LayerImages[]) => {
      const setEffect = Effect.gen(function* (_) {
        const validatedImages = yield* _(
          Effect.tryPromise({
            try: () =>
              Promise.resolve(
                layerImages.map((image) => S.decodeSync(LayerImagesSchema)(image) as LayerImages)
              ),
            catch: () => Promise.resolve(layerImages),
          })
        );

        setState(() => ({ layerImages: validatedImages }));
      });

      void Effect.runPromise(
        pipe(
          setEffect,
          Effect.catchAll((error) =>
            Effect.succeed(() => {
              console.warn('Invalid layer images:', error);
              setState(() => ({ layerImages }));
            })
          )
        )
      );
    },

    setExpandedLayer: (layerNames: string[]) =>
      setState(() => ({
        expandedLayer: layerNames,
      })),

    setLoadedImage: (
      key: string,
      imageSrc: string | null,
      blend: BlendProperties,
      dimensions?: Dimensions
    ) => {
      const setEffect = Effect.gen(function* (_) {
        const imageEntry = yield* _(
          Effect.tryPromise({
            try: () =>
              Promise.resolve(
                S.decodeSync(ImageEntrySchema)({
                  src: imageSrc,
                  blend,
                  dimensions,
                }) as ImageEntry
              ),
            catch: () =>
              Promise.resolve({
                src: imageSrc,
                blend,
                dimensions,
              }),
          })
        );

        setState((state) => ({
          loadedImages: {
            ...state.loadedImages,
            [key]: imageEntry,
          },
        }));
      });

      void Effect.runPromise(
        pipe(
          setEffect,
          Effect.catchAll((error) =>
            Effect.succeed(() => {
              console.error(`Error validating image entry for ${key}:`, error);
              setState((state) => ({
                loadedImages: {
                  ...state.loadedImages,
                  [key]: {
                    src: imageSrc,
                    blend,
                    dimensions,
                  },
                },
              }));
            })
          )
        )
      );
    },

    setLoadingState: (layerName, isLoading) =>
      setState((state) => ({
        loadingStates: { ...state.loadingStates, [layerName]: isLoading },
      })),

    updateImageCount: (layerName, count) =>
      setState((state) => ({
        imageCounts: { ...state.imageCounts, [layerName]: count },
      })),

    loadLayerImageNames: async () => {
      const loadEffect = Effect.gen(function* (_) {
        const { selectedFolder } = useProjectSetupStore.getState();
        const { getOrderedLayers, getRarityConfig } = useRarityStore.getState();

        if (!selectedFolder) {
          setState(() => ({ layerImages: [], imageCounts: {} }));
          return;
        }

        const currentState = get();
        const newProjectId = selectedFolder.split(/[\\/]/).pop() ?? '';

        if (currentState.projectId !== newProjectId) {
          fileExistsCache.clear();
          blendPropertiesCache.clear();
          processedFramesCache.clear();

          const initialState = createInitialState();
          set({ ...initialState, projectId: newProjectId });
        }

        const layers = getOrderedLayers();
        const rarityConfig = getRarityConfig();

        const newLoadingStates: Record<string, boolean> = Object.fromEntries(
          layers.map((layer) => [layer, true])
        );
        const newImageCounts: Record<string, number> = Object.fromEntries(
          layers.map((layer) => [layer, 0])
        );

        setState(() => ({
          loadingStates: newLoadingStates,
          imageCounts: newImageCounts,
        }));

        const layerImagesData = yield* _(
          Effect.all(
            layers.map((layer) =>
              Effect.gen(function* (_) {
                const allFiles = yield* _(
                  Effect.tryPromise(() => api.getLayerImageNames(selectedFolder, layer))
                );

                const validatedFiles = yield* _(
                  Effect.tryPromise({
                    try: () =>
                      Promise.resolve(S.decodeSync(ImageNameListSchema)(allFiles) as string[]),
                    catch: () => Promise.resolve([] as string[]),
                  })
                );

                const imageNames = validatedFiles.filter(isImageFile);
                get().updateImageCount(layer, imageNames.length);

                const existingLayer = get().layerImages.find((l) => l.layerName === layer);
                const hasAnimatedImages = existingLayer?.hasAnimatedImages ?? false;
                const existingImageInfos = existingLayer?.imageInfos;

                const layerImage = S.decodeSync(LayerImagesSchema)({
                  layerName: layer,
                  imageNames,
                  imageInfos: existingImageInfos,
                  blendProperties: {},
                  hasAnimatedImages,
                  framesProcessed: false,
                }) as LayerImages;

                const blendProperties =
                  rarityConfig[layer]?.defaultBlend ?? DEFAULT_BLEND_PROPERTIES;
                const batchSize = 5;
                const imageNamesCopy = [...imageNames];

                while (imageNamesCopy.length > 0) {
                  const batch = imageNamesCopy.splice(0, batchSize);
                  try {
                    yield* _(
                      Effect.tryPromise(() =>
                        Promise.all(
                          batch.map((imageName) =>
                            get().loadImage(layer, imageName, blendProperties)
                          )
                        )
                      )
                    );
                  } catch (error) {
                    console.error(`Error loading batch for layer ${layer}:`, error);
                  }
                  yield* _(
                    Effect.tryPromise(() => new Promise((resolve) => setTimeout(resolve, 50)))
                  );
                }

                get().setLoadingState(layer, false);

                return layerImage;
              })
            )
          )
        );

        setState(() => ({ layerImages: layerImagesData }));
      });

      await Effect.runPromise(
        pipe(
          loadEffect,
          Effect.catchAll((error) =>
            Effect.succeed(() => {
              console.error('Error loading layer image names:', error);
            })
          )
        )
      );
    },

    loadImage: async (layerName: string, imageName: string, blendProperties: BlendProperties) => {
      const { selectedFolder, isAnimatedCollection } = useProjectSetupStore.getState();
      if (!selectedFolder) {
        return;
      }

      const key = `${layerName}/${imageName}`;
      try {
        const imageNameWithoutExt = removeFileExtension(imageName);
        const foundFile = imageName;

        const imagePath = await Effect.runPromise(
          Effect.tryPromise(() => api.getLayerImagePath(selectedFolder, layerName, foundFile))
        );

        if (!imagePath) {
          console.warn(`No image path received for ${layerName}/${imageName}`);
          get().setLoadedImage(key, null, blendProperties);
          return;
        }

        const imageSrc = convertFileSrc(imagePath);

        const isVideo = /\.(mp4|webm|mov|avi|mkv)$/i.test(imageName);

        const dimensions = await Effect.runPromise(
          Effect.tryPromise(
            () =>
              new Promise<Dimensions>((resolve, reject) => {
                const timeout = setTimeout(() => {
                  reject(new Error(`Media load timeout for ${layerName}/${imageName}`));
                }, 10000);

                if (isVideo) {
                  const video = document.createElement('video');
                  video.preload = 'metadata';
                  video.muted = true;

                  video.onloadedmetadata = () => {
                    clearTimeout(timeout);
                    try {
                      const result = S.decodeSync(DimensionsSchema)({
                        width: video.videoWidth,
                        height: video.videoHeight,
                      }) as Dimensions;
                      resolve(result);
                    } catch (error) {
                      reject(new Error('Invalid video dimensions', { cause: error }));
                    }
                  };

                  video.onerror = (e) => {
                    clearTimeout(timeout);
                    reject(new Error(`Failed to load video ${layerName}/${imageName}: ${e}`));
                  };

                  video.src = imageSrc;
                  video.load();
                } else {
                  const img = new Image();

                  img.onload = () => {
                    clearTimeout(timeout);
                    try {
                      const result = S.decodeSync(DimensionsSchema)({
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                      }) as Dimensions;
                      resolve(result);
                    } catch (error) {
                      reject(new Error('Invalid image dimensions', { cause: error }));
                    }
                  };

                  img.onerror = () => {
                    clearTimeout(timeout);
                    reject(new Error(`Failed to load image ${layerName}/${imageName}`));
                  };

                  img.src = imageSrc;
                }
              })
          )
        );

        const framesProcessed = processFrames(
          get().projectId,
          layerName,
          imageNameWithoutExt,
          isAnimatedCollection
        );

        get().setLoadedImage(key, imageSrc, blendProperties, dimensions);

        setState((state) => ({
          layerImages: state.layerImages.map((layer) =>
            layer.layerName === layerName
              ? { ...layer, framesProcessed: layer.framesProcessed ?? framesProcessed }
              : layer
          ),
        }));
      } catch (error) {
        console.warn(`Error loading image ${imageName} for layer ${layerName}:`, error);
        get().setLoadedImage(key, null, blendProperties);
      }
    },

    handleLayerExpand: (layerName) => {
      const currentExpanded = get().expandedLayer;
      const isExpanded = currentExpanded.includes(layerName);
      const newExpanded = isExpanded
        ? currentExpanded.filter((name) => name !== layerName)
        : [...currentExpanded, layerName];

      set({ expandedLayer: newExpanded });
    },

    getLayerPreviewData: () => {
      const { getOrderedLayers } = useRarityStore.getState();
      return {
        orderedLayers: getOrderedLayers(),
        loadingStates: get().loadingStates,
        imageCounts: get().imageCounts,
      };
    },

    preloadLayerImages: async (layerName: string) => {
      const preloadEffect = Effect.gen(function* (_) {
        const { selectedFolder } = useProjectSetupStore.getState();
        const { getRarityConfig } = useRarityStore.getState();

        if (!selectedFolder) {
          return;
        }

        const layer = get().layerImages.find((l) => l.layerName === layerName);
        if (!layer) {
          return;
        }

        const rarityConfig = getRarityConfig();
        const batchSize = 10;
        const imageNames = [...layer.imageNames];

        while (imageNames.length > 0) {
          const batch = imageNames.splice(0, batchSize);
          yield* _(
            Effect.tryPromise(() =>
              Promise.all(
                batch.map((imageName) => {
                  const traitName = removeFileExtension(imageName);
                  const blendProperties = getBlendPropertiesForTrait(
                    layerName,
                    traitName,
                    rarityConfig
                  );
                  return get().loadImage(layerName, imageName, blendProperties);
                })
              )
            )
          );
          yield* _(Effect.tryPromise(() => new Promise((resolve) => setTimeout(resolve, 50))));
        }
      });

      await Effect.runPromise(
        pipe(
          preloadEffect,
          Effect.catchAll((error) =>
            Effect.succeed(() => {
              console.error('Error preloading layer images:', error);
            })
          )
        )
      );
    },

    clearUnusedImages: (activeLayers: string[]) => {
      setState((state) => {
        const loadedImages = { ...state.loadedImages };

        Object.keys(loadedImages).forEach((key) => {
          const [layerName] = key.split('/');
          if (!activeLayers.includes(layerName)) {
            delete loadedImages[key];
          }
        });

        return { loadedImages };
      });
    },

    reloadAllImages: async () => {
      const reloadEffect = Effect.gen(function* (_) {
        const { selectedFolder } = useProjectSetupStore.getState();
        if (!selectedFolder) {
          return;
        }

        setState(() => ({ loadedImages: {} }));
        yield* _(Effect.tryPromise(() => get().loadLayerImageNames()));

        const expandedLayers = get().expandedLayer;
        yield* _(
          Effect.tryPromise(() =>
            Promise.all(expandedLayers.map((layerName) => get().preloadLayerImages(layerName)))
          )
        );
      });

      await Effect.runPromise(
        pipe(
          reloadEffect,
          Effect.catchAll((error) =>
            Effect.succeed(() => {
              console.error('Error reloading all images:', error);
            })
          )
        )
      );
    },

    reloadLayerImages: async (layerName: string) => {
      const reloadEffect = Effect.gen(function* (_) {
        const { selectedFolder } = useProjectSetupStore.getState();
        if (!selectedFolder) {
          return;
        }

        const allFiles = yield* _(
          Effect.tryPromise(() => api.getLayerImageNames(selectedFolder, layerName))
        );

        const validatedFiles = yield* _(
          Effect.tryPromise({
            try: () => Promise.resolve(S.decodeSync(ImageNameListSchema)(allFiles) as string[]),
            catch: () => Promise.resolve([] as string[]),
          })
        );

        const imageNames = validatedFiles.filter(isImageFile);

        setState((state) => ({
          loadedImages: Object.fromEntries(
            Object.entries(state.loadedImages).filter(([key]) => !key.startsWith(`${layerName}/`))
          ),
        }));

        const { getRarityConfig } = useRarityStore.getState();
        const rarityConfig = getRarityConfig();

        yield* _(
          Effect.tryPromise(() =>
            Promise.all(
              imageNames.map((imageName) => {
                const traitName = removeFileExtension(imageName);
                const blendProperties = getBlendPropertiesForTrait(
                  layerName,
                  traitName,
                  rarityConfig
                );
                return get().loadImage(layerName, imageName, blendProperties);
              })
            )
          )
        );
      });

      await Effect.runPromise(
        pipe(
          reloadEffect,
          Effect.catchAll((error) =>
            Effect.succeed(() => {
              console.error('Error reloading layer images:', error);
            })
          )
        )
      );
    },

    updateLayerName: (oldName: string, newName: string) => {
      setState((state) => {
        const updatedLayerImages = state.layerImages.map((layer) =>
          layer.layerName === oldName ? { ...layer, layerName: newName } : layer
        );

        const updatedLoadedImages = Object.entries(state.loadedImages).reduce(
          (acc, [key, value]) => {
            const [layerName, imageName] = key.split('/');
            const newKey = layerName === oldName ? `${newName}/${imageName}` : key;
            acc[newKey] = value;
            return acc;
          },
          {} as Record<string, ImageEntry>
        );

        return {
          layerImages: updatedLayerImages,
          loadedImages: updatedLoadedImages,
        };
      });
    },

    updateTraitName: (layerName: string, oldTraitName: string, newTraitName: string) => {
      setState((state) => {
        const updatedLayerImages = state.layerImages.map((layer) => {
          if (layer.layerName === layerName) {
            const updatedImageNames = layer.imageNames.map((imageName) => {
              const traitName = removeFileExtension(imageName);
              return traitName === oldTraitName
                ? imageName.replace(oldTraitName, newTraitName)
                : imageName;
            });
            return { ...layer, imageNames: updatedImageNames };
          }
          return layer;
        });

        const updatedLoadedImages = Object.entries(state.loadedImages).reduce(
          (acc, [key, value]) => {
            const [layer, imageName] = key.split('/');
            if (layer === layerName) {
              const traitName = removeFileExtension(imageName);
              const newImageName =
                traitName === oldTraitName
                  ? imageName.replace(oldTraitName, newTraitName)
                  : imageName;
              const newKey = `${layerName}/${newImageName}`;
              acc[newKey] = value;
            } else {
              acc[key] = value;
            }
            return acc;
          },
          {} as Record<string, ImageEntry>
        );

        return {
          layerImages: updatedLayerImages,
          loadedImages: updatedLoadedImages,
          lastUpdate: performance.now(),
        };
      });
    },

    projectId: '',

    setProjectId: (id: string) => set({ projectId: id }),

    cleanupFrames: async () => {
      await api.cleanupProjectFrames(get().projectId);
    },

    getProjectId: () => get().projectId,

    forceUpdate: () => {
      set((state) => ({
        ...state,
        lastUpdate: performance.now(),
      }));
    },
  };
});
