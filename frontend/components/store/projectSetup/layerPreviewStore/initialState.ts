import type { LayerPreviewState } from '@/types/effect';

export const createInitialState = (): LayerPreviewState => {
  return {
    layerImages: [],
    expandedLayer: [],
    loadedImages: {},
    loadingStates: {},
    imageCounts: {},
    projectId: '',
    lastUpdate: performance.now(),
  };
};
