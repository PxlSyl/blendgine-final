import type { TintingSliceState } from '../types';

export const createInitialState = (): TintingSliceState => ({
  tintingOptions: {
    includeFilterInMetadata: true,
    pipelines: [
      {
        id: 'default_pipeline',
        name: 'Pipeline 1',
        effects: [],
        distributionPercentage: 100,
      },
    ],
    activePipelineId: 'default_pipeline',
  },
  selectedPaletteName: '',
  lastAdjustmentMade: false,
});
