import { create } from 'zustand';

import { api } from '@/services';
import { useStore } from '..';
import { useProjectSetupStore } from '../projectSetup/main';

import { useRarityStore } from '../rarityStore/main';
import { useFlipFlopStore } from '../filters/flipflop';
import { useFilterStore } from '../filters/files';
import { useUpdateStore } from '../update';
import { useGenerationSettingsStore } from '../generationsettings';
import { useTintingStore } from '../filters/main';
import { useLayerOrderStore } from '../layerOrder/main';
import { usePreview3DStore } from '../layerOrder/preview3Dstore';

import { useIncompatibilitiesStore } from '@/components/windows/rules/store/incompatibilitiesStore';
import { useForcedCombinationStore } from '@/components/windows/rules/store/forcedCombinationsStore';

import { useRulesStore } from '@/components/windows/rules/store/main';
import { useShortcutsStore } from '@/components/windows/shortcuts/store';
import { useLayersviewStore } from '@/components/windows/layersview/store';
import { useZoomEffectsStore } from '@/components/windows/zoom effects/store';
import { useLayerOrderZoomStore } from '@/components/windows/layerOrderZoom/store';

import type {
  SetInfo,
  ApplyTintsAndFiltersArgs,
  ConsoleMessage,
  AnimationQualityConfig,
  ResizeConfig,
  SolanaMetadataConfig,
  RarityConfig,
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
    void useZoomEffectsStore.getState().closeZoomEffectsWindow();
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
  setIsApplyingFilters: (value: boolean) => set({ isApplyingFilters: value }),
  setFilterState: (state: 'idle' | 'cancelled' | 'applying' | 'success' | 'error') =>
    set({ filterState: state }),
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

    const filterStore = useFilterStore.getState();
    filterStore.setSourceFolder('');
    filterStore.setDestinationFolder('');
    filterStore.setHasUserSelectedFolders(false);

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

      const filterStore = useFilterStore.getState();
      filterStore.setExportFormat(imageFormat);

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
      setIsApplyingFilters,
      setFilterState,
      setCurrentMode,
      setGenerationState,
      setShowSuccessScreen,
    } = get();

    setShowConfetti(false);
    setShowMenu(true);
    setIsApplyingFilters(false);
    setFilterState('idle');
    setCurrentMode('generation');
    setShowSuccessScreen(false);
    setGenerationState({
      status: 'idle',
      error: null,
    });
    setMessage('');
  },

  handleApplyFilters: async () => {
    const validation = await get().validateFilterParams();
    if (!validation.isValid) {
      return;
    }

    const { setMessage } = useStore.getState();
    const {
      setShowDots,
      setFilterState,
      setIsApplyingFilters,
      setShowConfetti,
      setCurrentMode,
      setShowSuccessScreen,
      setShowMenu,
      closeAllWindows,
      clearGenerationData,
    } = get();

    clearGenerationData();

    closeAllWindows();

    const { sourceFolder, destinationFolder, exportFormat, isAnimated, flipOptions } =
      useFilterStore.getState();
    const { collectionName } = useProjectSetupStore.getState();
    const { imageFormat } = useGenerationSettingsStore.getState();

    const { getRarityConfig } = useRarityStore.getState();
    const { tintingOptions } = useTintingStore.getState();

    setShowDots(true);
    setFilterState('applying');
    setIsApplyingFilters(true);
    setShowMenu(false);
    setMessage('Counting files in source folder...');

    try {
      const fileCount = await api.countImagesInFolder({
        folderPath: sourceFolder,
        imageFormat,
        collectionName,
      });

      if (fileCount === 0) {
        throw new Error('No images found in source folder');
      }

      setMessage(`Found ${fileCount} images. Applying filters...`);

      if (!flipOptions) {
        throw new Error('Flip options are not initialized');
      }

      const filteredPipelines = tintingOptions.pipelines.map((pipeline) => ({
        ...pipeline,
        effects: pipeline.effects.filter((effect) => effect.enabled),
      }));

      const args: ApplyTintsAndFiltersArgs = {
        sourceFolder,
        destinationFolder,
        collectionName,
        imageFormat,
        exportFormat,
        nftCount: fileCount,
        rarityConfig: JSON.parse(JSON.stringify(getRarityConfig())) as RarityConfig,
        tintingOptions: {
          includeFilterInMetadata: tintingOptions.includeFilterInMetadata,
          pipelines: filteredPipelines,
          activePipelineId: tintingOptions.activePipelineId,
        },
        flipOptions: { ...flipOptions },
        isAnimated,
        effectChainId: `generation_chain_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      };

      const result = await api.applyTintsAndFilters(args);

      if (result.success) {
        const filterStore = useFilterStore.getState();
        filterStore.setSourceFolder(sourceFolder);
        filterStore.setDestinationFolder(destinationFolder);
        filterStore.setHasUserSelectedFolders(true);
        await filterStore.saveState();

        setMessage('Filters applied successfully');
        setFilterState('success');
        setShowDots(false);
        setTimeout(() => {
          setShowConfetti(true);
          setShowSuccessScreen(true);
        }, 500);
      } else {
        throw new Error(result.error ?? 'An error occurred while applying filters');
      }
    } catch (error) {
      console.error('Error in handleApplyFilters:', error);
      setMessage(`Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
      setFilterState('error');
    } finally {
      setIsApplyingFilters(false);
      setShowDots(false);
    }

    setCurrentMode('filters');
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

  handleFilterCancel: async () => {
    const { setMessage } = useStore.getState();
    const {
      setShowDots,
      setShowConfetti,
      setFilterState,
      setIsApplyingFilters,
      setShowSuccessScreen,
    } = get();

    setFilterState('cancelled');
    setIsApplyingFilters(false);
    setShowConfetti(false);
    setShowSuccessScreen(false);
    setShowDots(false);
    setMessage('Filter application cancelled');

    await api.cancelFilterApplication().catch((error) => {
      console.error('Error cancelling filter application:', error);
    });
  },

  validateFilterParams: async () => {
    const { sourceFolder, destinationFolder } = useFilterStore.getState();
    const { tintingOptions } = useTintingStore.getState();
    const { flipOptions } = useFlipFlopStore.getState();
    const { setFilterState } = get();

    if (!sourceFolder?.trim()) {
      await api.showDialog({
        title: 'Source Folder Required',
        message: 'Please select your source folder',
        dialogType: 'warning',
      });
      setFilterState('error');
      return { isValid: false, error: 'Source folder not selected' };
    }

    if (!destinationFolder?.trim()) {
      await api.showDialog({
        title: 'Destination Folder Required',
        message: 'Please select your destination folder',
        dialogType: 'warning',
      });
      setFilterState('error');
      return { isValid: false, error: 'Destination folder not selected' };
    }

    const hasActiveFilters = tintingOptions?.pipelines?.some(
      (pipeline) => pipeline.effects.length > 0
    );

    const hasActiveFlips =
      flipOptions &&
      (flipOptions.horizontalFlipPercentage > 0 || flipOptions.verticalFlipPercentage > 0);

    if (!hasActiveFilters && !hasActiveFlips) {
      await api.showDialog({
        title: 'No Effects Selected',
        message: 'Please set a percentage for at least one filter or flip before applying',
        dialogType: 'warning',
      });
      setFilterState('error');
      return { isValid: false, error: 'No effects selected' };
    }

    return { isValid: true };
  },
}));
