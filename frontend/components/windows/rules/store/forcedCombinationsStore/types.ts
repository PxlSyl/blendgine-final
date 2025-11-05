import * as E from 'effect/Effect';

import type {
  ForcedCombinationState,
  ForcedCombinationSide,
  ForcedCombinations,
  RarityConfig,
} from '@/types/effect';

import { EffectOrPromise } from '@/utils/effect/effectPromiseUtils';

export interface LayerOrderState {
  sets: Record<
    string,
    {
      id: string;
      name: string;
      customName?: string;
      createdAt: string;
      layers: string[];
      nftCount: number;
    }
  >;
  activeSetId: string;
  layerOrder?: string[];
}

export type ForcedCombinationStore = ForcedCombinationState & {
  _cachedLayerOrderState: LayerOrderState;
  _dataInitialized: boolean;
  _refreshLayerOrderCache: () => Promise<LayerOrderState>;
  setActiveSet: (setId: string) => EffectOrPromise<void>;
  setAvailableSets: (sets: number[]) => void;
  updateState: (state: Partial<ForcedCombinationState>) => E.Effect<void, Error, never>;
  resetStore: () => Promise<void>;
  resetCombinationStore: () => Promise<void>;
  addForcedCombinationSelector: () => void;
  updateForcedCombinationSelector: (
    id: number,
    updates: Partial<{
      firstCategory: string;
      firstItem: string;
      secondCategory: string;
      secondItem: string;
    }>
  ) => EffectOrPromise<void>;
  removeForcedCombinationSelector: (id: number) => void;
  addForcedCombination: (
    item1: string,
    category1: string,
    item2: string,
    category2: string
  ) => Promise<void>;
  removeForcedCombination: (
    item1: string,
    category1: string,
    item2: string,
    category2: string
  ) => Promise<void>;
  updateForcedCombinationRarity: (
    layer1: string,
    trait1: string,
    layer2: string,
    trait2: string,
    newRarity: number
  ) => Promise<void>;
  loadPersistedState: () => Promise<ForcedCombinationState>;
  saveState: () => Promise<void>;
  isLayerTraitValid: (layer: string, trait: string, rarityConfig?: RarityConfig) => boolean;
  resetIfInvalid: (id: number, side: ForcedCombinationSide, rarityConfig: RarityConfig) => void;
  cleanupForcedCombinations: (rarityConfig: RarityConfig) => void;
  initializeSet: (setId: string) => void;
  getLowerLayer: (layer1: string, layer2: string) => string;
  getActiveSetForcedCombinations: () => ForcedCombinations;
  resetForcedCombinationStateForActiveSet: () => Promise<void>;
  resetForcedCombinationStore: () => Promise<void>;
  initializeData: () => Promise<void>;
};
