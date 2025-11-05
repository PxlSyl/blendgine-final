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
  isApplyingFilters: false,
  filterState: 'idle' as 'idle' | 'cancelled' | 'applying' | 'success' | 'error',
  isMixComplete: false,
  showSuccessScreen: false,
  consoleMessages: [],
  isPaused: false,
};
