import type {
  RarityConfig,
  SetOrderedLayersArg,
  LayerOrderState as EffectLayerOrderState,
} from '@/types/effect';

export interface LayerOrderState extends EffectLayerOrderState {
  lastUpdate?: number;
}

export interface LayerOrderActions {
  resetLayerOrderStore: () => Promise<void>;
  addSet: () => void;
  duplicateSet: (setNumberToDuplicate: number) => void;
  deleteSet: (setNumber: number) => void;
  setActiveSet: (setNumber: number) => void;
  setOrderedLayers: (newLayers: SetOrderedLayersArg, targetSetId?: string) => void;
  getAllActiveLayers: () => string[];
  moveLayer: (fromIndex: number, toIndex: number) => void;
  toggleLayerDisabled: (layer: string) => void;
  toggleTraitDisabled: (layer: string, traitName: string) => void;
  toggleLayerExpansion: (layer: string) => void;
  setRarityConfig: (config: RarityConfig) => void;
  updateRarityConfig: <T extends RarityConfig>(updater: (config: T) => T) => void;
  saveRarityConfig: () => Promise<void>;
  loadRarityConfig: () => Promise<void>;
  getActiveLayers: () => string[];
  addLayer: (layer: string) => void;
  calculatePossibleCombinations: () => void;
  loadPersistedState: () => Promise<void>;
  saveState: () => Promise<void>;
  expandAllLayers: () => void;
  collapseAllLayers: () => void;
  enableAllLayers: () => void;
  disableAllLayers: () => void;
  setForcedTrait: (layer: string, trait: string) => void;
  removeForcedTrait: (layer: string) => void;
  getOrderedLayers: () => string[];
  isLayerActive: (layer: string) => boolean;
  isTraitEnabled: (layer: string, trait: string) => boolean;
  updateOrderedLayers: () => void;
  updateSetNFTCount: (setId: string, count: number) => void;
  getTotalNFTCount: () => number;
  setCustomSetName: (setNumber: number, customName: string) => void;
  reorderSets: (activeId: string, overId: string) => void;
  initializeSetOrders: () => void;
  forceUpdate: () => void;
}
