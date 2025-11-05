import type { LayerData } from '@/components/windows/layersview/services/types';

export interface LayersviewStore {
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  currentLayerName: string | null;
  currentTraitName: string | null;
  layerData: LayerData | null;
  targetImageLoaded: boolean;
  openLayersWindow: (layerName: string, traitName: string) => Promise<void>;
  closeWindow: () => Promise<void>;
  checkWindowStatus: () => Promise<boolean>;
  setCurrentLayerName: (layerName: string) => void;
  setCurrentTraitName: (traitName: string) => void;
  loadLayerImages: (layerName: string, traitName: string) => Promise<void>;
  nextImage: () => void;
  previousImage: () => void;
  resetToTarget: () => void;
  getAllAvailableLayersAndTraits: () => Promise<{
    layers: string[];
    traitsByLayer: Record<string, string[]>;
  }>;
}
