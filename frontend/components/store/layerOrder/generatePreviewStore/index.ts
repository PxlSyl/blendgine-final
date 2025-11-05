import { create } from 'zustand';
import { Effect, pipe } from 'effect';
import { emit } from '@tauri-apps/api/event';

import { DEFAULT_BLEND_PROPERTIES } from '@/types/blendModes';
import { GeneratePreviewState, GeneratePreviewActions, LayerImageData } from './types';
import { TraitConfig } from '@/types/effect';

import { createDefaultGeneratePreviewState } from '@/schemas/effect/layerOrder/generatePreviewStore';

import { useLayerOrderStore } from '../main/index';
import { usePreviewCanvasStore } from '../previewCanvasStore';
import { usePreview3DStore } from '../preview3Dstore';
import { useLayerPreviewStore } from '../../projectSetup/layerPreviewStore';
import { useProjectSetupStore } from '../../projectSetup/main';

import { createEmptyImage, sortLayersByZIndex, createImageCacheKey } from './utils';
import {
  checkForcedCombinationsEffect,
  checkTraitCompatibilityEffect,
  getLayerImageEffect,
} from './services';

type GeneratePreviewStore = GeneratePreviewState & GeneratePreviewActions;

const initialState: GeneratePreviewState = createDefaultGeneratePreviewState();

const clearImageCacheEffect = Effect.sync(() => ({ imageCache: {} }));

export const useGeneratePreviewStore = create<GeneratePreviewStore>((set, get) => ({
  ...initialState,

  clearImageCache: () => {
    const result = Effect.runSync(clearImageCacheEffect);
    set(result);
  },

  sortLayersByZIndex,

  getLayerImage: async (layerName: string, imageName: string): Promise<LayerImageData> => {
    const { selectedFolder } = useProjectSetupStore.getState();
    if (!selectedFolder) {
      throw new Error('No folder selected');
    }

    const { imageCache } = get();
    const cacheKey = createImageCacheKey(selectedFolder, layerName, imageName);

    const program = pipe(
      getLayerImageEffect({
        selectedFolder,
        layerName,
        imageName,
        imageCache,
      }),
      Effect.tap((newImage) =>
        Effect.sync(() => {
          set((state) => ({
            imageCache: {
              ...state.imageCache,
              [cacheKey]: newImage,
            },
          }));
        })
      ),
      Effect.catchAll((error) => Effect.fail(error))
    );

    return Effect.runPromise(program);
  },

  checkTraitCompatibility: async (
    layerName: string,
    traitName: string,
    selectedTraits: Record<string, string>
  ) => {
    return Effect.runPromise(checkTraitCompatibilityEffect(layerName, traitName, selectedTraits));
  },

  checkForcedCombinations: async (
    layerName: string,
    traitName: string,
    selectedTraits: Record<string, string>,
    orderedLayers: string[]
  ) => {
    return Effect.runPromise(
      checkForcedCombinationsEffect(layerName, traitName, selectedTraits, orderedLayers)
    );
  },

  generatePreview: async () => {
    const program = Effect.gen(function* (_) {
      const layerOrderStore = useLayerOrderStore.getState();
      const previewCanvasStore = usePreviewCanvasStore.getState();
      const { activeSetId } = layerOrderStore;
      const currentSetId = activeSetId ?? 'set1';

      yield* _(
        Effect.sync(() => {
          useLayerOrderStore.setState({
            layerImages: {},
            currentTraits: {},
          });
          previewCanvasStore.clearImages();
        })
      );

      const activeLayers =
        layerOrderStore.sets[currentSetId]?.layers.filter((layerName) => {
          const layerConfig = layerOrderStore.rarityConfig[layerName];
          return (
            layerConfig?.sets?.[currentSetId]?.active === true &&
            Object.values(layerConfig?.traits ?? {}).some(
              (t: TraitConfig) => t.sets?.[currentSetId]?.enabled
            )
          );
        }) ?? [];

      const sortedLayers = sortLayersByZIndex(activeLayers);
      const { loadedImages } = useLayerPreviewStore.getState();
      const newImages = {};
      const newTraits = {};
      const selectedTraits = {};

      for (const layerName of sortedLayers) {
        const layerConfig = layerOrderStore.rarityConfig[layerName];
        if (!layerConfig) {
          continue;
        }

        let traitToUse: string | null = null;
        const activeSetTraits = layerOrderStore.forcedTraits[currentSetId] ?? {};

        if (activeSetTraits[layerName]) {
          traitToUse = activeSetTraits[layerName];
        } else {
          const traits = layerConfig.traits ?? {};
          const enabledTraits = Object.entries(traits)
            .filter(([, trait]: [string, TraitConfig]) => trait.sets?.[currentSetId]?.enabled)
            .map(([name]) => name);

          if (enabledTraits.length === 0) {
            continue;
          }

          const compatibleTraits: string[] = [];
          for (const trait of enabledTraits) {
            const isCompatible = yield* _(
              checkTraitCompatibilityEffect(layerName, trait, selectedTraits)
            );
            const respectsForcedCombinations = yield* _(
              checkForcedCombinationsEffect(layerName, trait, selectedTraits, sortedLayers)
            );

            if (isCompatible && respectsForcedCombinations) {
              compatibleTraits.push(trait);
            }
          }

          if (compatibleTraits.length > 0) {
            traitToUse = compatibleTraits[Math.floor(Math.random() * compatibleTraits.length)];
          } else {
            traitToUse = enabledTraits[Math.floor(Math.random() * enabledTraits.length)];
            console.warn(
              `No compatible traits found for ${layerName}, using random trait: ${traitToUse}`
            );
          }
        }

        if (!traitToUse) {
          continue;
        }

        const traits = layerConfig.traits ?? {};
        const traitConfig = traits[traitToUse];
        if (!traitConfig?.sets?.[currentSetId]?.enabled) {
          continue;
        }

        selectedTraits[layerName] = traitToUse;

        if (traitToUse === 'None') {
          const emptyImage = createEmptyImage();
          newImages[layerName] = {
            path: emptyImage.url,
            blend: layerConfig.defaultBlend ?? DEFAULT_BLEND_PROPERTIES,
          };
          newTraits[layerName] = 'None';
          continue;
        }

        const possibleKeys = [
          `${layerName}/${traitToUse}`,
          `${layerName}/${traitToUse}.png`,
          traitToUse,
          `${traitToUse}.png`,
        ];

        let foundImage: string | null = null;
        for (const key of possibleKeys) {
          const img = loadedImages[key];
          if (img?.src) {
            foundImage = img.src;
            break;
          }
        }

        if (foundImage) {
          newImages[layerName] = {
            path: foundImage,
            blend:
              traitConfig?.sets?.[currentSetId]?.blend ||
              layerConfig.defaultBlend ||
              DEFAULT_BLEND_PROPERTIES,
          };
          newTraits[layerName] = traitToUse;
        } else {
          const imageData = yield* _(
            Effect.tryPromise({
              try: () => get().getLayerImage(layerName, traitToUse ?? ''),
              catch: (error) => {
                console.warn(`Failed to load image for ${layerName}/${traitToUse}:`, error);
                return {
                  url: '',
                  isLoading: false,
                  error: error instanceof Error ? error.message : String(error),
                };
              },
            })
          );

          if (!imageData.url || imageData.error) {
            console.warn(
              `Failed to load image data for ${layerName}/${traitToUse}:`,
              imageData.error
            );
            continue;
          }

          const layerTraits = layerConfig.traits ?? {};
          newImages[layerName] = {
            path: imageData.url,
            blend:
              layerTraits[traitToUse]?.sets?.[currentSetId]?.blend ||
              layerConfig.defaultBlend ||
              DEFAULT_BLEND_PROPERTIES,
          };
          newTraits[layerName] = traitToUse;
        }
      }

      const expectedLayerCount = activeLayers.filter((layer) => {
        const config = layerOrderStore.rarityConfig[layer];
        return (
          config?.sets?.[currentSetId]?.active &&
          Object.values(config?.traits ?? {}).some(
            (t: TraitConfig) => t.sets?.[currentSetId]?.enabled
          )
        );
      }).length;

      if (Object.keys(newImages).length !== expectedLayerCount) {
        console.warn('Some images failed to load', {
          expected: expectedLayerCount,
          loaded: Object.keys(newImages).length,
        });
      }

      if (Object.keys(newImages).length > 0) {
        const orderedLayers = sortLayersByZIndex(Object.keys(newImages));

        yield* _(
          Effect.sync(() => {
            useLayerOrderStore.setState((state) => ({
              ...state,
              layerImages: newImages,
              currentTraits: newTraits,
            }));

            usePreview3DStore.setState((state) => ({
              ...state,
              generationId: Date.now(),
            }));
          })
        );

        yield* _(
          Effect.tryPromise({
            try: () =>
              previewCanvasStore.loadImages(
                useProjectSetupStore.getState().selectedFolder ?? '',
                orderedLayers,
                usePreview3DStore.getState().generationId
              ),
            catch: (error) => new Error(`Failed to load images in canvas: ${String(error)}`),
          })
        );

        yield* _(
          Effect.tryPromise({
            try: () => emit('layer-order-zoom-refresh'),
            catch: (error) => {
              console.warn('Failed to emit layer-order-zoom-refresh:', error);
              return Promise.resolve();
            },
          })
        );
      }
    }).pipe(
      Effect.catchAll((error) => {
        console.error('Error generating preview:', error);
        return Effect.succeed(undefined);
      })
    );

    return Effect.runPromise(program);
  },

  forceTraitPreview: async (layer: string, trait: string) => {
    const program = Effect.gen(function* (_) {
      const layerOrderStore = useLayerOrderStore.getState();
      const { activeSetId, rarityConfig } = layerOrderStore;
      const currentSetId = activeSetId ?? 'set1';
      const currentSetLayers = layerOrderStore.sets[currentSetId]?.layers ?? [];
      const orderedLayers = sortLayersByZIndex(currentSetLayers);
      const currentSetForcedTraits = layerOrderStore.forcedTraits[currentSetId] ?? {};
      const forcedTraitValue = currentSetForcedTraits[layer];

      yield* _(
        Effect.sync(() => {
          if (forcedTraitValue === trait) {
            layerOrderStore.removeForcedTrait(layer);
          } else {
            layerOrderStore.setForcedTrait(layer, trait);
          }
        })
      );

      yield* _(
        Effect.tryPromise({
          try: () => new Promise((resolve) => setTimeout(resolve, 0)),
          catch: () => new Error('Failed to wait for state update'),
        })
      );

      const updatedForcedTraits = useLayerOrderStore.getState().forcedTraits[currentSetId] ?? {};
      const newTraits = {};
      const newImages = {};

      for (const layerName of orderedLayers) {
        const layerConfig = rarityConfig[layerName];
        if (!layerConfig?.sets?.[currentSetId]?.active) {
          continue;
        }

        let traitToUse: string;
        if (updatedForcedTraits[layerName]) {
          traitToUse = updatedForcedTraits[layerName];
        } else {
          const traits = layerConfig.traits ?? {};
          const enabledTraits = Object.entries(traits)
            .filter(([, trait]: [string, TraitConfig]) => trait.sets?.[currentSetId]?.enabled)
            .map(([name]) => name);

          if (enabledTraits.length === 0) {
            continue;
          }
          traitToUse = enabledTraits[Math.floor(Math.random() * enabledTraits.length)];
        }

        const traits = layerConfig.traits ?? {};
        const traitConfig = traits[traitToUse];
        if (!traitConfig?.sets?.[currentSetId]?.enabled) {
          continue;
        }

        newTraits[layerName] = traitToUse;

        if (traitToUse === 'None') {
          const emptyImage = createEmptyImage();
          newImages[layerName] = {
            path: emptyImage.url,
            blend: layerConfig.defaultBlend ?? DEFAULT_BLEND_PROPERTIES,
          };
        } else {
          const imageData = yield* _(
            Effect.tryPromise({
              try: () => get().getLayerImage(layerName, traitToUse),
              catch: (error) => {
                console.warn(`Failed to load image for ${layerName}/${traitToUse}:`, error);
                return {
                  url: '',
                  isLoading: false,
                  error: error instanceof Error ? error.message : String(error),
                };
              },
            })
          );

          if (!imageData.url || imageData.error) {
            console.warn(
              `Failed to load image data for ${layerName}/${traitToUse}:`,
              imageData.error
            );
            continue;
          }

          newImages[layerName] = {
            path: imageData.url,
            blend:
              traitConfig?.sets?.[currentSetId]?.blend ||
              layerConfig.defaultBlend ||
              DEFAULT_BLEND_PROPERTIES,
          };
        }
      }

      yield* _(
        Effect.sync(() => {
          const store = useLayerOrderStore.getState();
          store.currentTraits = newTraits;
          store.layerImages = newImages;
        })
      );

      yield* _(
        Effect.tryPromise({
          try: () =>
            usePreviewCanvasStore
              .getState()
              .loadImages(
                useProjectSetupStore.getState().selectedFolder ?? '',
                sortLayersByZIndex(Object.keys(newImages)),
                usePreview3DStore.getState().generationId
              ),
          catch: (error) => new Error(`Failed to load images in canvas: ${String(error)}`),
        })
      );
    }).pipe(
      Effect.catchAll((error) => {
        console.error('Error forcing trait preview:', error);
        return Effect.succeed(undefined);
      })
    );

    return Effect.runPromise(program);
  },
}));
