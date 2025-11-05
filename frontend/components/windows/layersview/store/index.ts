import { create } from 'zustand';
import * as Effect from 'effect/Effect';

import type { LayersviewStore } from './types';

import { makeLayersviewService } from '@/components/windows/layersview/services/layersviewService';

export const useLayersviewStore = create<LayersviewStore>((set, get) => ({
  isOpen: false,
  isLoading: false,
  error: null,
  currentLayerName: null,
  currentTraitName: null,
  layerData: null,
  targetImageLoaded: false,

  openLayersWindow: async (layerName: string, traitName: string) => {
    const service = await Effect.runPromise(makeLayersviewService);
    await Effect.runPromise(service.openLayersWindow(layerName, traitName));
    set({ isOpen: true });
  },

  closeWindow: async () => {
    const service = await Effect.runPromise(makeLayersviewService);
    await Effect.runPromise(service.closeWindow());
    set({ isOpen: false, layerData: null });
  },

  checkWindowStatus: async () => {
    const service = await Effect.runPromise(makeLayersviewService);
    return Effect.runPromise(
      Effect.catchAll(service.checkWindowStatus(), (error) => {
        console.error('LayersviewStore: Error checking window status:', error);
        return Effect.succeed(false);
      })
    );
  },

  setCurrentLayerName: (layerName: string) => {
    set({ currentLayerName: layerName });
  },

  setCurrentTraitName: (traitName: string) => {
    set({ currentTraitName: traitName });
  },

  loadLayerImages: async (layerName: string, traitName: string) => {
    const service = await Effect.runPromise(makeLayersviewService);
    return Effect.runPromise(
      Effect.catchAll(
        Effect.gen(function* (_) {
          set({ isLoading: true, error: null, targetImageLoaded: false });
          const layerData = yield* _(service.loadLayerImages(layerName, traitName));
          set({ layerData, isLoading: false, targetImageLoaded: true });
        }),
        (error) => {
          console.error('LayersviewStore: Error loading layer images:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to load layer images',
            isLoading: false,
          });
          return Effect.succeed(undefined);
        }
      )
    );
  },

  nextImage: () => {
    const { layerData } = get();
    if (!layerData || layerData.images.length === 0) {
      return;
    }

    const nextIndex = (layerData.currentIndex + 1) % layerData.images.length;
    const nextImage = layerData.images[nextIndex];

    set({
      layerData: {
        ...layerData,
        currentIndex: nextIndex,
      },
      currentTraitName: nextImage.name,
      currentLayerName: layerData.layerName,
    });
  },

  previousImage: () => {
    const { layerData } = get();
    if (!layerData || layerData.images.length === 0) {
      return;
    }

    const prevIndex =
      (layerData.currentIndex - 1 + layerData.images.length) % layerData.images.length;
    const prevImage = layerData.images[prevIndex];

    set({
      layerData: {
        ...layerData,
        currentIndex: prevIndex,
      },
      currentTraitName: prevImage.name,
      currentLayerName: layerData.layerName,
    });
  },

  resetToTarget: () => {
    const { layerData } = get();
    if (!layerData || layerData.images.length === 0 || layerData.targetIndex === undefined) {
      return;
    }

    set({
      layerData: {
        ...layerData,
        currentIndex: layerData.targetIndex,
        navigationMode: 'target',
      },
    });
  },

  getAllAvailableLayersAndTraits: async () => {
    const service = await Effect.runPromise(makeLayersviewService);
    return Effect.runPromise(
      Effect.catchAll(service.getAllAvailableLayersAndTraits(), (error) => {
        console.error('LayersviewStore: Error getting available layers and traits:', error);
        return Effect.succeed({ layers: [], traitsByLayer: {} });
      })
    );
  },
}));
