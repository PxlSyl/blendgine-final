import { StateCreator } from 'zustand';

import type { Preview3DState } from '../types';

export interface AnimationState {
  isPaused: boolean;
  lastFrame: number;
  lastFrameTime: number;
  wasPlaying: boolean;
  animationFrameId?: number;
}

export type AnimationSliceState = Pick<
  Preview3DState,
  | 'meshes'
  | 'maxFrames'
  | 'currentFrame'
  | 'setCurrentFrame'
  | 'spritesheetLayout'
  | 'fps'
  | 'frameInterval'
  | 'animationState'
  | 'isGenerating'
>;

export interface AnimationSlice {
  startAnimation: () => void;
  stopAnimation: () => void;
  setCurrentFrame: (frame: number) => void;
  setMaxFrames: (frames: number) => void;
  setFPS: (fps: number) => void;
  syncAnimation: (timestamp: number) => void;
  animationState: AnimationState;
  setAnimationState: (state: {
    isPaused: boolean;
    lastFrame: number;
    lastFrameTime: number;
  }) => void;
  updateAnimation: () => void;
  handleGenerationStateChange: (isGenerating: boolean) => void;
}

export const createAnimationSlice: StateCreator<AnimationSliceState, [], [], AnimationSlice> = (
  set,
  get
) => {
  const updateAnimation = () => {
    const state = get();
    if (state.isGenerating || state.animationState.isPaused) {
      return;
    }

    const now = performance.now();
    const timeSinceLastFrame = now - state.animationState.lastFrameTime;

    if (timeSinceLastFrame >= state.frameInterval) {
      const framesToAdvance = Math.floor(timeSinceLastFrame / state.frameInterval);
      const actualNextFrame = (state.currentFrame + framesToAdvance) % state.maxFrames;

      set((state) => ({
        ...state,
        currentFrame: actualNextFrame,
        animationState: {
          ...state.animationState,
          lastFrame: actualNextFrame,
          lastFrameTime: now - (timeSinceLastFrame % state.frameInterval),
        },
      }));
    }

    const animationFrameId = requestAnimationFrame(updateAnimation);
    set((state) => ({
      ...state,
      animationState: {
        ...state.animationState,
        animationFrameId,
      },
    }));
  };

  const cleanupAnimation = () => {
    const state = get();
    if (state.animationState.animationFrameId) {
      cancelAnimationFrame(state.animationState.animationFrameId);
      set((state) => ({
        ...state,
        animationState: {
          ...state.animationState,
          animationFrameId: undefined,
        },
      }));
    }
  };

  return {
    startAnimation: () => {
      const state = get();
      if (state.isGenerating) {
        return;
      }

      cleanupAnimation();
      set((state) => ({
        ...state,
        animationState: {
          ...state.animationState,
          isPaused: false,
          wasPlaying: true,
          lastFrameTime: performance.now(),
        },
      }));
      updateAnimation();
    },

    stopAnimation: () => {
      cleanupAnimation();
      set((state) => ({
        ...state,
        animationState: {
          ...state.animationState,
          isPaused: true,
          lastFrame: state.currentFrame,
          lastFrameTime: performance.now(),
          wasPlaying: state.animationState.wasPlaying,
        },
      }));
    },

    setCurrentFrame: (frame: number) => {
      set((state) => {
        if (!state.maxFrames) {
          return state;
        }
        const newFrame = Math.max(0, Math.min(frame, state.maxFrames - 1));
        return {
          ...state,
          currentFrame: newFrame,
          animationState: {
            ...state.animationState,
            lastFrame: newFrame,
            lastFrameTime: performance.now(),
          },
        };
      });
    },

    setMaxFrames: (frames: number) => {
      set((state) => {
        const newMaxFrames = Math.max(1, frames);
        if (newMaxFrames === state.maxFrames) {
          return state;
        }
        return {
          ...state,
          maxFrames: newMaxFrames,
          currentFrame: Math.min(state.currentFrame, newMaxFrames - 1),
        };
      });
    },

    setFPS: (fps: number) => {
      set({
        fps,
        frameInterval: 1000 / fps,
      });
    },

    syncAnimation: (timestamp: number) => {
      const state = get();
      if (state.isGenerating || state.animationState.isPaused) {
        return;
      }

      const timeSinceLastFrame = timestamp - state.animationState.lastFrameTime;

      if (timeSinceLastFrame >= state.frameInterval) {
        const framesToAdvance = Math.floor(timeSinceLastFrame / state.frameInterval);
        const actualNextFrame = (state.currentFrame + framesToAdvance) % state.maxFrames;

        set((state) => ({
          ...state,
          currentFrame: actualNextFrame,
          animationState: {
            ...state.animationState,
            lastFrame: actualNextFrame,
            lastFrameTime: timestamp - (timeSinceLastFrame % state.frameInterval),
          },
        }));
      }
    },

    animationState: {
      isPaused: false,
      lastFrame: 0,
      lastFrameTime: 0,
      wasPlaying: true,
      animationFrameId: undefined,
    },

    setAnimationState: (state: { isPaused: boolean; lastFrame: number; lastFrameTime: number }) => {
      set((currentState) => {
        const wasPaused = currentState.animationState.isPaused;

        if (!wasPaused && state.isPaused) {
          cleanupAnimation();
        } else if (wasPaused && !state.isPaused) {
          cleanupAnimation();
          updateAnimation();
        }

        return {
          ...currentState,
          animationState: {
            ...currentState.animationState,
            ...state,
            wasPlaying: currentState.animationState.wasPlaying,
          },
          currentFrame: state.lastFrame,
        };
      });
    },

    handleGenerationStateChange: (isGenerating: boolean) => {
      if (isGenerating) {
        cleanupAnimation();
        set((state) => ({
          ...state,
          isGenerating: true,
          animationState: {
            ...state.animationState,
            isPaused: true,
            animationFrameId: undefined,
          },
        }));
      } else {
        cleanupAnimation();
        set((state) => {
          if (!state.maxFrames || state.maxFrames <= 0) {
            return {
              ...state,
              isGenerating: false,
              maxFrames: 1,
              currentFrame: 0,
              animationState: {
                ...state.animationState,
                isPaused: false,
                animationFrameId: undefined,
                lastFrameTime: performance.now(),
              },
            };
          }

          return {
            ...state,
            isGenerating: false,
            animationState: {
              ...state.animationState,
              animationFrameId: undefined,
              lastFrameTime: performance.now(),
            },
          };
        });

        const state = get();
        if (state.maxFrames > 0 && !state.animationState.isPaused) {
          updateAnimation();
        }
      }
    },

    updateAnimation,
  };
};
