import type {
  LayerImages,
  LayerPreviewState,
  ImageEntry,
  BlendProperties,
  Dimensions,
} from '@/types/effect';

export type ReadonlyLayerImages = Readonly<LayerImages>;
export type ReadonlyLayerPreviewState = Readonly<LayerPreviewState> & {
  readonly layerImages: readonly ReadonlyLayerImages[];
  readonly loadedImages: Readonly<Record<string, Readonly<ImageEntry>>>;
  readonly loadingStates: Readonly<Record<string, boolean>>;
  readonly imageCounts: Readonly<Record<string, number>>;
};

export interface LayerPreviewStore extends ReadonlyLayerPreviewState {
  resetLayerPreviewStore: () => Promise<void>;
  setLayerImages: (layerImages: LayerImages[]) => void;
  setExpandedLayer: (layerNames: string[]) => void;
  setLoadedImage: (
    key: string,
    imageSrc: string | null,
    blend: BlendProperties,
    dimensions?: Dimensions
  ) => void;
  setLoadingState: (layerName: string, isLoading: boolean) => void;
  updateImageCount: (layerName: string, count: number) => void;
  loadLayerImageNames: () => Promise<void>;
  loadImage: (layerName: string, imageName: string, blend: BlendProperties) => Promise<void>;
  handleLayerExpand: (layerName: string) => void;
  getLayerPreviewData: () => {
    orderedLayers: readonly string[];
    loadingStates: Readonly<Record<string, boolean>>;
    imageCounts: Readonly<Record<string, number>>;
  };
  preloadLayerImages: (layerName: string) => Promise<void>;
  clearUnusedImages: (activeLayers: string[]) => void;
  reloadAllImages: () => Promise<void>;
  reloadLayerImages: (layerName: string) => Promise<void>;
  updateLayerName: (oldName: string, newName: string) => void;
  updateTraitName: (layerName: string, oldTraitName: string, newTraitName: string) => void;
  setProjectId: (id: string) => void;
  getProjectId: () => string;
  cleanupFrames: () => Promise<void>;
  forceUpdate: () => void;
}
