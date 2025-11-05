import type { ResizeConfig } from '@/types/effect';

export const defaultResizeConfig: ResizeConfig = {
  algorithm: 'CONVOLUTION',
  filter: 'LANCZOS',
  superSamplingFactor: 2,
};
