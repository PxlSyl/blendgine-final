import type {
  IncompatibilityState,
  IncompatibilitySelectorType,
  IncompatibilitySide,
  Incompatibilities,
  RarityConfig,
} from '@/types/effect';

import { EffectOrPromise } from '@/utils/effect/effectPromiseUtils';

export type StoreGet = () => IncompatibilityState;
export type StoreSet = (
  state: Partial<IncompatibilityState> | ((state: IncompatibilityState) => IncompatibilityState)
) => void;

export type ResetIfInvalidFn = (
  get: StoreGet,
  set: StoreSet,
  id: number,
  side: IncompatibilitySide,
  rarityConfig: RarityConfig
) => void;

export type CleanupIncompatibilitiesFn = (
  get: StoreGet,
  set: StoreSet,
  rarityConfig: RarityConfig
) => void;

export interface InternalIncompatibilityState extends IncompatibilityState {
  _dataInitialized: boolean;
}

export interface IncompatibilityActions {
  addIncompatibility: (
    layer1: string,
    trait1: string,
    layer2: string,
    trait2: string
  ) => EffectOrPromise<void>;
  removeIncompatibility: (
    layer1: string,
    trait1: string,
    layer2: string,
    trait2: string
  ) => EffectOrPromise<void>;
  addIncompatibilitySelector: () => EffectOrPromise<void>;
  removeIncompatibilitySelector: (id: number) => EffectOrPromise<void>;
  updateIncompatibilitySelector: (
    id: number,
    updates: Partial<IncompatibilitySelectorType>
  ) => EffectOrPromise<void>;
  loadPersistedState: () => EffectOrPromise<void>;
  saveState: () => EffectOrPromise<void>;
  isLayerTraitValid: (layer: string, trait: string, rarityConfig: RarityConfig) => boolean;
  resetIfInvalid: (id: number, side: IncompatibilitySide, rarityConfig: RarityConfig) => void;
  cleanupIncompatibilities: (rarityConfig: RarityConfig) => void;
  resetStore: () => EffectOrPromise<void>;
  setActiveSet: (setNumber: number) => EffectOrPromise<void>;
  setAvailableSets: (sets: number[]) => EffectOrPromise<void>;
  updateState: (state: Partial<IncompatibilityState>) => EffectOrPromise<void>;
  getActiveSetIncompatibilities: () => Incompatibilities;
  resetIncompatibilityStore: () => EffectOrPromise<void>;
  initializeSet: (setId: string) => EffectOrPromise<void>;
  resetIncompatibilityStateForActiveSet: () => EffectOrPromise<void>;
  resetIncompatibilitiesStore: () => EffectOrPromise<void>;
  initializeData: () => EffectOrPromise<void>;
}
