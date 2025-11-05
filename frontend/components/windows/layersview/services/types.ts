import * as Effect from 'effect/Effect';

export interface RarityData {
  rarity: number;
  globalRarity: number;
}

export interface ImageData {
  name: string;
  url: string;
  rarity: Record<string, RarityData>;
}

export interface SetInfo {
  id: string;
  name: string;
}

export interface LayerData {
  layerName: string;
  traitName: string;
  images: ImageData[];
  currentIndex: number;
  navigationMode: 'target' | 'manual';
  targetIndex?: number;
  searchIndex?: number;
  availableSets: SetInfo[];
}

export interface LayersviewService {
  openLayersWindow: (layerName: string, traitName: string) => Effect.Effect<never, Error, never>;
  closeWindow: () => Effect.Effect<never, Error, never>;
  checkWindowStatus: () => Effect.Effect<never, Error, boolean>;
  loadLayerImages: (layerName: string, traitName: string) => Effect.Effect<never, Error, LayerData>;
  getAllAvailableLayersAndTraits: () => Effect.Effect<
    never,
    Error,
    { layers: string[]; traitsByLayer: Record<string, string[]> }
  >;
}
