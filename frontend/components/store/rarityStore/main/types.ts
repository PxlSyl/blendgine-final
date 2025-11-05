import { InitSlice } from './slices/InitSlice';
import { CommonSlice } from './slices/CommonSlice';
import { EqualSlice } from './slices/EqualSlice';
import { RandomSlice } from './slices/RandomSlice';
import { ResetSlice } from './slices/ResetSlice';
import { SkipToggleSlice } from './slices/SkipToggleSlice';
import { MainSlice } from './slices/MainSlice';

export interface RarityActions
  extends InitSlice,
    CommonSlice,
    EqualSlice,
    RandomSlice,
    ResetSlice,
    SkipToggleSlice,
    MainSlice {}
