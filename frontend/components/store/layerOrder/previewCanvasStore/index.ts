import { create } from 'zustand';

import type { PreviewCanvasStore } from './types';

import { createImageLoadingSlice } from './slices/imageLoadingSlice';
import { createUtilitiesSlice } from './slices/utilitiesSlice';

export const usePreviewCanvasStore = create<PreviewCanvasStore>((set, get, store) => ({
  images: [],
  error: null,
  framesByLayer: {},

  ...createImageLoadingSlice(set, get, store),
  ...createUtilitiesSlice(set, get, store),
}));
