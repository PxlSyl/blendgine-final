import type {
  GeneratePreviewState as EffectGeneratePreviewState,
  GeneratePreviewLayerImageData as EffectGeneratePreviewLayerImageData,
} from '@/types/effect';

export type LayerImageData = EffectGeneratePreviewLayerImageData;

export type GeneratePreviewState = EffectGeneratePreviewState;

export interface GeneratePreviewActions {
  generatePreview: () => Promise<void>;
  forceTraitPreview: (layer: string, trait: string) => Promise<void>;
  getLayerImage: (layerName: string, imageName: string) => Promise<LayerImageData>;
  clearImageCache: () => void;
  sortLayersByZIndex: (layers: string[]) => string[];
  checkTraitCompatibility: (
    layerName: string,
    traitName: string,
    selectedTraits: Record<string, string>
  ) => Promise<boolean>;
  checkForcedCombinations: (
    layerName: string,
    traitName: string,
    selectedTraits: Record<string, string>,
    orderedLayers: string[]
  ) => Promise<boolean>;
}
