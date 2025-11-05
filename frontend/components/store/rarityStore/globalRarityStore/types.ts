import * as E from 'effect/Effect';

import type { GlobalRarityData } from '@/types/effect';

export type { GlobalRarityData };

export interface GlobalRarityState {
  isGlobalViewActive: boolean;
  lastActiveSet: string;
  persistedRarityData: Record<string, GlobalRarityData[]>;
}

export interface GlobalRarityActions {
  setGlobalViewActive: (isActive: boolean) => E.Effect<void, Error, never>;
  getGlobalRarityData: (layer: string) => GlobalRarityData[];
  toggleGlobalView: () => E.Effect<void, Error, never>;
  updateGlobalRarityFromConfig: () => Promise<void>;
  refreshGlobalRarityData: () => Promise<void>;
}
