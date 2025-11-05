import type { LayerOrderState } from './types';

export const createInitialState = (): LayerOrderState => ({
  sets: {},
  activeSetId: 'set1',
  rarityConfig: {},
  possibleCombinations: 0,
  expandedLayers: {},
  layerImages: {},
  currentTraits: {},
  forcedTraits: {},
  setOrders: [],
  lastUpdate: Date.now(),
});
