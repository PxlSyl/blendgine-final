import { create } from 'zustand';
import { RarityActions } from './types';
import { createEqualSlice } from './slices/EqualSlice';
import { createRandomSlice } from './slices/RandomSlice';
import { createResetSlice } from './slices/ResetSlice';
import { createInitSlice } from './slices/InitSlice';
import { createCommonSlice } from './slices/CommonSlice';
import { createSkipToggleSlice } from './slices/SkipToggleSlice';
import { createMainSlice } from './slices/MainSlice';

export const useRarityStore = create<RarityActions>((set, get, store) => {
  const equalSlice = createEqualSlice(set, get, store);
  const randomSlice = createRandomSlice(set, get, store);
  const resetSlice = createResetSlice(set, get, store);
  const initSlice = createInitSlice(set, get, store);
  const commonSlice = createCommonSlice(set, get, store);
  const skipToggleSlice = createSkipToggleSlice(set, get, store);
  const mainSlice = createMainSlice(set, get, store);

  return {
    ...initSlice,
    ...commonSlice,
    ...equalSlice,
    ...randomSlice,
    ...resetSlice,
    ...skipToggleSlice,
    ...mainSlice,
  };
});
