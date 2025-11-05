import { StateCreator } from 'zustand';
import * as THREE from 'three';

import type { Preview3DState } from '../types';

type CacheSliceState = Pick<
  Preview3DState,
  'materialCache' | 'textureCache' | 'geometryCache' | 'meshCache' | 'meshes'
>;

export interface CacheSlice {
  clearGeometryCache: () => void;
  clearTextureCache: () => void;
  clearCache: () => void;
}

export const createCacheSlice: StateCreator<CacheSliceState, [], [], CacheSlice> = (set, get) => ({
  clearGeometryCache: () => {
    const { geometryCache } = get();
    geometryCache.forEach((geometry) => {
      geometry.dispose();
    });
    geometryCache.clear();
  },

  clearTextureCache: () => {
    const { textureCache } = get();
    textureCache.forEach((texture) => {
      texture.dispose();
    });
    textureCache.clear();
  },

  clearCache: () => {
    const state = get();

    state.materialCache.forEach((material) => material.dispose());
    state.textureCache.forEach((texture) => texture.dispose());
    state.geometryCache.forEach((geometry) => geometry.dispose());

    Object.values(state.meshCache).forEach((meshes) => {
      meshes.forEach((mesh) => {
        if (mesh.material instanceof THREE.Material) {
          mesh.material.dispose();
        }
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
      });
    });

    set({
      materialCache: new Map(),
      textureCache: new Map(),
      geometryCache: new Map(),
      meshCache: {},
      meshes: [],
    });
  },
});
