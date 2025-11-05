import type {
  AppState as EffectAppState,
  GenerationState as EffectGenerationState,
  ConsoleMessage,
} from '@/types/effect';

export type GenerationState = EffectGenerationState;
export type AppState = Omit<EffectAppState, 'filterState'> & {
  filterState: 'idle' | 'cancelled' | 'applying' | 'success' | 'error';
  consoleMessages: ConsoleMessage[];
  isPaused: boolean;
  isCancelling: boolean;
};

export interface AppActions {
  setShowDots: (show: boolean) => void;
  setShowConfetti: (show: boolean) => void;
  setShowMenu: (show: boolean) => void;
  setGenerationState: (
    state: GenerationState | ((prev: GenerationState) => GenerationState)
  ) => void;
  setIsCancelled: (cancelled: boolean) => void;
  setIsCancelling: (cancelling: boolean) => void;
  setCurrentMode: (mode: 'generation' | 'filters') => void;
  setIsApplyingFilters: (applying: boolean) => void;
  setFilterState: (state: 'idle' | 'applying' | 'success' | 'cancelled' | 'error') => void;
  setIsMixComplete: (complete: boolean) => void;
  setShowSuccessScreen: (show: boolean) => void;
  setPaused: (paused: boolean) => void;

  addConsoleMessage: (message: Omit<ConsoleMessage, 'id' | 'timestamp'>) => void;
  clearGenerationData: () => void;

  handleStepChange: (newStep: number) => void;
  handleMetadataStepChange: (newStep: number) => void;
  handleIntroComplete: () => void;
  handleCancel: () => Promise<void>;
  handleGenerate: () => Promise<void>;
  handleQuit: () => void;
  backToMenu: () => void;
  handleApplyFilters: () => Promise<void>;
  handleMixLegendaryNFTs: (legendaryFolder: string, exportFolder: string) => Promise<void>;
  handleFilterCancel: () => Promise<void>;
  validateGenerationParams: () => Promise<{ isValid: boolean; error?: string }>;
  validateFilterParams: () => Promise<{ isValid: boolean; error?: string }>;
  closeAllWindows: () => void;
}
