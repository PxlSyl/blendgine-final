import type { AppState } from './types';

export const initialState: AppState = {
  showDots: false,
  showConfetti: false,
  showMenu: true,
  generationState: {
    status: 'idle',
    error: null,
  },
  isCancelled: false,
  isCancelling: false,
  currentMode: 'generation',
  isMixComplete: false,
  showSuccessScreen: false,
  consoleMessages: [],
  isPaused: false,
};
