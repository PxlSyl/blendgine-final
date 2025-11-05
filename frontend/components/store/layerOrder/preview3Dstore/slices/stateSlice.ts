import { StateCreator } from 'zustand';

import type { CameraState, OrbitControlsParams, Preview3DState, ViewParams } from '../types';

import { initialState } from '../initialState';
import { usePreview3DStore } from '../index';

type StateSliceState = Pick<
  Preview3DState,
  | 'fps'
  | 'frameInterval'
  | 'generationId'
  | 'cameraType'
  | 'perspectiveCameraState'
  | 'orthographicCameraState'
  | 'perspectiveControls'
  | 'orthographicControls'
  | 'perspectiveParams'
  | 'orthographicParams'
  | 'viewMode'
  | 'camera'
  | 'activeControls'
  | 'textureManager'
  | 'clearCache'
  | 'meshes'
  | 'cleanupMesh'
  | 'handleCameraRestore'
  | 'setPerspectiveControls'
  | 'setOrthographicControls'
  | 'setCurrentControls'
  | 'animationState'
>;

export interface StateSlice {
  setFPS: (fps: number) => void;
  setGenerationId: (id: number) => void;
  resetPreview3DStore: () => Promise<void>;
  setCameraType: (type: 'perspective' | 'orthographic') => void;
  setPerspectiveCameraState: (state: CameraState) => void;
  setOrthographicCameraState: (state: CameraState) => void;
  setPerspectiveControls: (params: Partial<OrbitControlsParams>) => void;
  setOrthographicControls: (params: Partial<OrbitControlsParams>) => void;
  getCurrentControls: () => OrbitControlsParams;
  getCurrentParams: () => ViewParams;
  setCurrentControls: (params: Partial<OrbitControlsParams>) => void;
  setOrbitControls: (params: Partial<OrbitControlsParams>) => void;
  setPerspectiveParams: (params: ViewParams) => void;
  setOrthographicParams: (params: ViewParams) => void;
  setViewMode: (mode: '2d' | '3d') => void;
}

export const createStateSlice: StateCreator<StateSliceState, [], [], StateSlice> = (set, get) => ({
  setFPS: (fps: number) => set({ fps, frameInterval: 1000 / fps }),

  setGenerationId: (id: number) => set({ generationId: id }),

  resetPreview3DStore: async () => {
    await Promise.resolve();
    const currentState = get();
    set({
      ...initialState,
      animationState: currentState.animationState,
    });
  },

  setCameraType: (type: 'perspective' | 'orthographic') => set({ cameraType: type }),

  setPerspectiveCameraState: () =>
    set((state) => ({ perspectiveCameraState: { ...state.perspectiveCameraState, ...state } })),

  setOrthographicCameraState: () =>
    set((state) => ({ orthographicCameraState: { ...state.orthographicCameraState, ...state } })),

  setPerspectiveControls: (params: Partial<OrbitControlsParams>) =>
    set((state) => ({ perspectiveControls: { ...state.perspectiveControls, ...params } })),

  setOrthographicControls: (params: Partial<OrbitControlsParams>) =>
    set((state) => ({ orthographicControls: { ...state.orthographicControls, ...params } })),

  getCurrentControls: () => {
    const { cameraType, perspectiveControls, orthographicControls } = get();
    return cameraType === 'perspective' ? perspectiveControls : orthographicControls;
  },

  getCurrentParams: () => {
    const { cameraType, perspectiveParams, orthographicParams } = get();
    return cameraType === 'perspective' ? perspectiveParams : orthographicParams;
  },

  setCurrentControls: (params) => {
    const { cameraType } = get();
    if (cameraType === 'perspective') {
      get().setPerspectiveControls(params);
    } else {
      get().setOrthographicControls(params);
    }
  },

  setOrbitControls: (params) => {
    get().setCurrentControls(params);
  },

  setPerspectiveParams: (params: ViewParams) =>
    set((state) => ({ perspectiveParams: { ...state.perspectiveParams, ...params } })),

  setOrthographicParams: (params: ViewParams) =>
    set((state) => ({ orthographicParams: { ...state.orthographicParams, ...params } })),

  setViewMode: (mode: '2d' | '3d') => {
    const state = get();
    const { wasPlaying, isPaused } = state.animationState;

    set((state) => ({
      ...state,
      viewMode: mode,
    }));

    if (wasPlaying && !isPaused) {
      setTimeout(() => {
        const store = usePreview3DStore.getState();
        store.startAnimation();
      }, 0);
    }
  },
});
