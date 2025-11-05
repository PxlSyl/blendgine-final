import { create } from 'zustand';

import { api } from '@/services';
import { useStore } from '..';
import { useProjectSetupStore } from '../projectSetup/main';

import { useRarityStore } from '../rarityStore/main';
import { useUpdateStore } from '../update';
import { useGenerationSettingsStore } from '../generationsettings';
import { useLayerOrderStore } from '../layerOrder/main';
import { usePreview3DStore } from '../layerOrder/preview3Dstore';

import { useIncompatibilitiesStore } from '@/components/windows/rules/store/incompatibilitiesStore';
import { useForcedCombinationStore } from '@/components/windows/rules/store/forcedCombinationsStore';

import { useRulesStore } from '@/components/windows/rules/store/main';
import { useShortcutsStore } from '@/components/windows/shortcuts/store';
import { useLayersviewStore } from '@/components/windows/layersview/store';
import { useLayerOrderZoomStore } from '@/components/windows/layerOrderZoom/store';

import type {
  SetInfo,
  ConsoleMessage,
  AnimationQualityConfig,
  ResizeConfig,
  SolanaMetadataConfig,
} from '@/types/effect';
import type { AppState, AppActions } from './types';

import { initialState } from './initialState';

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const useGenerateStore = create<AppState & AppActions>((set, get) => ({
  ...initialState,

  consoleMessages: [] as ConsoleMessage[],
  isPaused: false,
  isCancelling: false,

  setPaused: (paused: boolean) => {
    set({ isPaused: paused });
    get().addConsoleMessage({
      type: 'info',
      message: paused ? 'Generation paused' : 'Generation resumed',
      sequenceNumber: 0,
    });
  },

  addConsoleMessage: (message: Omit<ConsoleMessage, 'id' | 'timestamp'>) => {
    const newMessage: ConsoleMessage = {
      id: generateUUID(),
      type: message.type,
      message: message.message,
      timestamp: new Date().toLocaleTimeString(),
      sequenceNumber: message.sequenceNumber ?? 0,
    };

    set((state) => {
      const newState = {
        consoleMessages: [...state.consoleMessages, newMessage].slice(-1000),
      };

      return newState;
    });
  },

  clearGenerationData: () => {
    set({
      consoleMessages: [],
    });
  },

  closeAllWindows: () => {
    void useRulesStore.getState().closeRulesWindow();
    void useShortcutsStore.getState().closeShortcutsWindow();
    void useLayersviewStore.getState().closeWindow();
    void useLayerOrderZoomStore.getState().closeLayerOrderZoomWindow();
  },
  setShowDots: (show) => set({ showDots: show }),
  setShowConfetti: (show) => set({ showConfetti: show }),
  setShowMenu: (show) => set({ showMenu: show }),
  setGenerationState: (stateOrUpdater) =>
    set((state) => {
      const newState =
        typeof stateOrUpdater === 'function'
          ? stateOrUpdater(state.generationState)
          : stateOrUpdater;

      if (state.generationState.status === 'completed' && newState.status === 'error') {
        console.warn('Attempted to set error state after completion, ignoring.');
        return state;
      }

      return { generationState: newState };
    }),
  setIsCancelled: (cancelled) => set({ isCancelled: cancelled }),
  setIsCancelling: (cancelling) => set({ isCancelling: cancelling }), // 🆕 Nouvelle action
  setCurrentMode: (mode) => set({ currentMode: mode }),
  setIsMixComplete: (complete) => set({ isMixComplete: complete }),
  setShowSuccessScreen: (show) => set({ showSuccessScreen: show }),

  handleStepChange: (newStep) => {
    const { setStep } = useStore.getState();
    setStep(newStep);
  },

  handleMetadataStepChange: (newStep) => {
    const { setMetadataStep } = useUpdateStore.getState();
    setMetadataStep(newStep);
  },

  handleIntroComplete: () => {
    const { setIntroStage } = useStore.getState();
    setIntroStage(1);
    setTimeout(() => setIntroStage(2), 1000);
  },

  handleCancel: async () => {
    const { setMessage } = useStore.getState();
    const { setShowDots, setShowConfetti, setShowSuccessScreen, setIsCancelling } = get();

    setIsCancelling(true);
    setMessage('NFT generation cancelled');
    setShowConfetti(false);
    setShowSuccessScreen(false);
    setShowDots(false);

    await api.cancelNFTGeneration().catch((error) => {
      console.error('Error cancelling generation:', error);
    });
  },

  validateGenerationParams: async () => {
    const { selectedFolder, exportFolder, collectionName } = useProjectSetupStore.getState();
    const layerOrderStore = useLayerOrderStore.getState();
    const { setGenerationState } = get();

    if (!exportFolder?.trim()) {
      await api.showDialog({
        title: 'Export Folder Required',
        message: 'Please select your export folder',
        dialogType: 'warning',
      });
      setGenerationState((prev) => ({
        ...prev,
        status: 'error',
        error: 'Export folder not selected',
      }));
      return { isValid: false, error: 'Export folder not selected' };
    }

    if (!collectionName?.trim()) {
      await api.showDialog({
        title: 'Collection Name Required',
        message: 'Please enter a name for your collection',
        dialogType: 'warning',
      });
      setGenerationState((prev) => ({
        ...prev,
        status: 'error',
        error: 'Collection name not provided',
      }));
      return { isValid: false, error: 'Collection name not provided' };
    }

    if (!selectedFolder?.trim()) {
      await api.showDialog({
        title: 'Layers Folder Required',
        message: 'Please select your layers folder',
        dialogType: 'warning',
      });
      setGenerationState((prev) => ({
        ...prev,
        status: 'error',
        error: 'Layers folder not selected',
      }));
      return { isValid: false, error: 'Layers folder not selected' };
    }

    const totalNFTCount = Object.values(layerOrderStore.sets as Record<string, SetInfo>).reduce(
      (total, set: SetInfo) => total + (set.nftCount || 0),
      0
    );

    if (totalNFTCount === 0) {
      await api.showDialog({
        title: 'No NFTs to Generate',
        message: 'Please set the number of NFTs to generate for at least one set',
        dialogType: 'warning',
      });
      setGenerationState((prev) => ({
        ...prev,
        status: 'error',
        error: 'No NFTs to generate',
      }));
      return { isValid: false, error: 'No NFTs to generate' };
    }

    return { isValid: true };
  },

  handleGenerate: async () => {
    const validation = await get().validateGenerationParams();
    if (!validation.isValid) {
      return;
    }

    const { setMessage } = useStore.getState();
    const {
      setGenerationState,
      setShowDots,
      setShowConfetti,
      setCurrentMode,
      setShowSuccessScreen,
      closeAllWindows,
      clearGenerationData,
    } = get();

    clearGenerationData();

    closeAllWindows();

    try {
      const {
        selectedFolder,
        exportFolder,
        collectionName,
        collectionDescription,
        includeRarity,
        maxFrames,
        spritesheetLayout,
        isAnimatedCollection,
      } = useProjectSetupStore.getState();

      const {
        imageFormat,
        baseWidth,
        baseHeight,
        finalWidth,
        finalHeight,
        allowDuplicates,
        shuffleSets,
        blockchain,
        solanaConfig,
        includeSpritesheets,
        animationQuality,
        resizeConfig,
      } = useGenerationSettingsStore.getState() as {
        imageFormat: string;
        baseWidth: number;
        baseHeight: number;
        finalWidth: number;
        finalHeight: number;
        allowDuplicates: boolean;
        shuffleSets: boolean;
        blockchain: 'eth' | 'sol';
        solanaConfig: SolanaMetadataConfig;
        includeSpritesheets: boolean;
        animationQuality: AnimationQualityConfig;
        resizeConfig: ResizeConfig;
      };

      const { fps } = usePreview3DStore.getState();
      const layerOrderStore = useLayerOrderStore.getState();
      const rarityStore = useRarityStore.getState();

      await layerOrderStore.saveState();
      await api.saveRarityConfig(rarityStore.getRarityConfig());
      await useIncompatibilitiesStore.getState().saveState();
      await useForcedCombinationStore.getState().saveState();

      const totalNFTCount = Object.values(layerOrderStore.sets as Record<string, SetInfo>).reduce(
        (total, set: SetInfo) => total + (set.nftCount || 0),
        0
      );

      set((state) => ({
        ...state,
        generationState: {
          status: 'generating',
          progress: {
            currentCount: 0,
            estimatedCount: 0,
            totalCount: Number(totalNFTCount),
          },
          error: null,
        },
        isCancelled: false,
        showMenu: false,
        showDots: true,
        showConfetti: false,
        showSuccessScreen: false,
        currentMode: 'generation',
      }));

      const generationArgs = {
        inputFolder: selectedFolder || '',
        exportFolder,
        collectionName,
        collectionDescription,
        includeRarity,
        imageFormat,
        baseWidth,
        baseHeight,
        finalWidth,
        finalHeight,
        allowDuplicates,
        shuffleSets,
        blockchain,
        isAnimatedCollection,
        solanaConfig: blockchain === 'sol' ? solanaConfig : undefined,
        includeSpritesheets,
        fps,
        animationQuality: animationQuality ?? undefined,
        resizeConfig: resizeConfig ?? undefined,
        totalFramesCount: maxFrames,
        spritesheetLayout,
      };

      const result = await api.startNFTGeneration(generationArgs);

      if (!result.success) {
        throw new Error(result.message);
      }

      await api.setLastCreatedCollection(exportFolder);

      setGenerationState((prev) => ({ ...prev, status: 'completed' }));
      setShowDots(false);
      setTimeout(() => {
        setShowConfetti(true);
        setShowSuccessScreen(true);
      }, 500);
      setMessage('All sets generated successfully!');
    } catch (error) {
      setGenerationState((prev) => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error during generation',
      }));
      setMessage(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setShowDots(false);
    }
    setCurrentMode('generation');
  },

  handleQuit: () => {
    window.close();
  },

  backToMenu: () => {
    const { setMessage } = useStore.getState();
    const {
      setShowConfetti,
      setShowMenu,
      setCurrentMode,
      setGenerationState,
      setShowSuccessScreen,
    } = get();

    setShowConfetti(false);
    setShowMenu(true);
    setCurrentMode('generation');
    setShowSuccessScreen(false);
    setGenerationState({
      status: 'idle',
      error: null,
    });
    setMessage('');
  },

  handleMixLegendaryNFTs: async (legendaryFolder, exportFolder) => {
    const { setMessage } = useStore.getState();
    const { setIsMixComplete } = get();

    if (!legendaryFolder || !exportFolder) {
      setMessage('Please select both legendary and export folders');
      return;
    }

    try {
      await api.mixLegendaryNFTs(legendaryFolder, exportFolder);
      setIsMixComplete(true);
      setMessage('Legendary NFTs have been successfully mixed with the generated collection.');
    } catch (error) {
      console.error('Error mixing legendary NFTs:', error);
      setMessage(
        `Error: ${error instanceof Error ? error.message : 'An unknown error occurred while mixing legendary NFTs'}`
      );
    }
  },
}));
