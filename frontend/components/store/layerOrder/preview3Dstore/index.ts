import { create } from 'zustand';

import type { Preview3DState } from './types';

import { initialState } from './initialState';

import {
  createStateSlice,
  createCacheSlice,
  createMeshSlice,
  createCameraSlice,
  createAnimationSlice,
  createGenerationSlice,
  createImageSlice,
} from './slices';

export const usePreview3DStore = create<Preview3DState>((set, get, store) => {
  const stateSlice = createStateSlice(set, get, store);
  const meshSlice = createMeshSlice(set, get, store);
  const cameraSlice = createCameraSlice(set, get, store);
  const animationSlice = createAnimationSlice(set, get, store);
  const cacheSlice = createCacheSlice(set, get, store);
  const generationSlice = createGenerationSlice(set, get, store);
  const imageSlice = createImageSlice(set, get, store);

  return {
    ...initialState,
    ...stateSlice,
    ...cacheSlice,
    ...cameraSlice,
    ...meshSlice,
    ...animationSlice,
    ...generationSlice,
    ...imageSlice,
  };
});
