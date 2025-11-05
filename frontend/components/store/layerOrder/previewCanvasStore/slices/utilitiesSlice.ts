import { StateCreator } from 'zustand';

import type { PreviewCanvasStore } from '../types';
import type { PreviewImage } from '@/types/preview';
import type { RarityConfig } from '@/types/effect';

import { useLayerOrderStore } from '@/components/store/layerOrder/main';

const sortImages = (
  images: PreviewImage[],
  currentSetId: string,
  rarityConfig: RarityConfig,
  orderedLayers: string[]
) => {
  return [...images].sort((a, b) => {
    const aLayerConfig = rarityConfig[a.layerName];
    const bLayerConfig = rarityConfig[b.layerName];

    const aTraitConfig = aLayerConfig?.traits?.[a.traitName];
    const bTraitConfig = bLayerConfig?.traits?.[b.traitName];

    const aZIndex = Number(
      aTraitConfig?.sets?.[currentSetId]?.zIndex ?? orderedLayers.indexOf(a.layerName) * 100
    );
    const bZIndex = Number(
      bTraitConfig?.sets?.[currentSetId]?.zIndex ?? orderedLayers.indexOf(b.layerName) * 100
    );

    if (isNaN(aZIndex) && isNaN(bZIndex)) {
      return 0;
    }
    if (isNaN(aZIndex)) {
      return 1;
    }
    if (isNaN(bZIndex)) {
      return -1;
    }

    if (aZIndex === bZIndex) {
      return orderedLayers.indexOf(a.layerName) - orderedLayers.indexOf(b.layerName);
    }

    return aZIndex - bZIndex;
  });
};

export const createUtilitiesSlice: StateCreator<
  PreviewCanvasStore,
  [],
  [],
  Pick<PreviewCanvasStore, 'updateImagesOrder' | 'clearImages' | 'resetPreviewCanvasStore'>
> = (set) => ({
  updateImagesOrder: (newOrder: string[]) => {
    set((state) => {
      const layerOrderStore = useLayerOrderStore.getState();
      const { rarityConfig } = layerOrderStore;
      const currentSetId = layerOrderStore.activeSetId ?? 'set1';

      const orderedImages = sortImages(state.images, currentSetId, rarityConfig, newOrder);

      return { images: orderedImages };
    });
  },

  clearImages: () => {
    set((state) => ({
      ...state,
      images: [],
      error: null,
    }));
  },

  resetPreviewCanvasStore: async () => {
    await Promise.resolve();
    set((state) => ({
      ...state,
      images: [],
      error: null,
      framesByLayer: {},
    }));
  },
});
