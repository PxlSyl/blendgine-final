import { create } from 'zustand';
import { api } from '@/services';
import { emit } from '@tauri-apps/api/event';
import { createEffectChain, type FilterInstance } from '@/types/effect';
import { usePipelinePreviewStore } from '../pipelinePreviews';

interface PreviewCanvasState {
  isGenerating: boolean;
  previewImage: string | null;
  originalImage: string | null;
  headerTitle: string;
  headerType: string | null;
  currentChainId: string | null;
  isSourceImageLocked: boolean;
  lockedSourceImage: string | null;
  currentPipelineId: string | null;

  generatePreview: (params: {
    activePreview: string;
    effects: FilterInstance[];
    sourceFolder: string;
    isSourceImageLocked: boolean;
    exportFormat?: string;
    isAnimated?: boolean;
    pipelineId?: string;
  }) => Promise<void>;

  clearImages: () => void;
  toggleSourceImageLock: () => void;
  clearLockedSourceImage: () => void;
  loadPipelinePreview: (pipelineId: string) => void;
}

export const usePreviewCanvasStore = create<PreviewCanvasState>((set, get) => ({
  isGenerating: false,
  previewImage: null,
  originalImage: null,
  headerTitle: 'Preview',
  headerType: null,
  currentChainId: null,
  isSourceImageLocked: false,
  lockedSourceImage: null,
  currentPipelineId: null,

  generatePreview: async ({
    activePreview,
    effects,
    sourceFolder,
    isSourceImageLocked,
    exportFormat = 'png',
    isAnimated = true,
    pipelineId,
  }: {
    activePreview: string;
    effects: FilterInstance[];
    sourceFolder: string;
    isSourceImageLocked: boolean;
    exportFormat?: string;
    isAnimated?: boolean;
    pipelineId?: string;
  }) => {
    if (!activePreview || !sourceFolder) {
      return;
    }

    set({ isGenerating: true });

    try {
      if (!effects || effects.length === 0) {
        console.warn('No effects configured. Please add some effects before generating preview.');
        return;
      }

      const effectChain = createEffectChain(effects, `Preview Chain ${Date.now()}`);
      const headerTitle = `Effects Chain: ${effectChain.name} (${effects.length} effects)`;

      const response = await api.generatePreviewImagesFiles({
        basePath: sourceFolder,
        effectChain,
        isSourceImageLocked,
        lockedSourceImagePath: isSourceImageLocked
          ? (get().lockedSourceImage ?? undefined)
          : undefined,
        exportFormat,
        isAnimated,
      });

      if (response.status === 'Success' && response.data) {
        const image = response.data;

        if (!image.originalFilePath || image.originalFilePath.length === 0) {
          console.error('Original image is missing or empty');
          return;
        }

        const lockedSourceImage = isSourceImageLocked
          ? image.originalFilePath
          : get().lockedSourceImage;

        if (pipelineId) {
          const pipelinePreviewStore = usePipelinePreviewStore.getState();
          pipelinePreviewStore.storePipelinePreview(pipelineId, {
            previewImagePath: image.filePath,
            originalImagePath: image.originalFilePath,
            effects,
            exportFormat,
            isAnimated,
          });
        }

        set({
          previewImage: image.filePath,
          originalImage: image.originalFilePath,
          currentChainId: effectChain.id,
          lockedSourceImage,
          currentPipelineId: pipelineId ?? null,
        });

        try {
          await emit('zoom-effects-init', {
            file_path: image.filePath,
            title: headerTitle,
          });
        } catch (error) {
          console.warn('Failed to emit zoom-effects-init:', error);
        }
      } else {
        console.error('Failed to generate preview:', response);
      }
    } catch (error) {
      console.error('Failed to generate preview:', error);
    } finally {
      set({ isGenerating: false });
    }
  },

  clearImages: () => {
    set({
      previewImage: null,
      originalImage: null,
      headerTitle: 'Preview',
      headerType: null,
      currentChainId: null,
      currentPipelineId: null,
    });
  },

  toggleSourceImageLock: () => {
    set((state) => {
      const newLockedState = !state.isSourceImageLocked;

      let newLockedSourceImage = state.lockedSourceImage;
      if (newLockedState && state.originalImage) {
        newLockedSourceImage = state.originalImage;
      }

      return {
        isSourceImageLocked: newLockedState,
        lockedSourceImage: newLockedSourceImage,
      };
    });
  },

  clearLockedSourceImage: () => {
    set({ lockedSourceImage: null });
  },

  loadPipelinePreview: (pipelineId: string) => {
    const pipelinePreviewStore = usePipelinePreviewStore.getState();
    const preview = pipelinePreviewStore.getPipelinePreview(pipelineId);

    if (preview) {
      set({
        previewImage: preview.previewImagePath,
        originalImage: preview.originalImagePath,
        currentPipelineId: pipelineId,
        headerTitle: `Pipeline Preview: ${pipelineId}`,
        headerType: 'pipeline',
      });
    }
  },
}));
