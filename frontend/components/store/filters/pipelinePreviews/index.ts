import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PipelinePreviewState, PipelinePreviewActions, PipelinePreviewImage } from '../types';

const initialState: PipelinePreviewState = {
  pipelinePreviews: {},
  activePreviewId: null,
};

export const usePipelinePreviewStore = create<PipelinePreviewState & PipelinePreviewActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      storePipelinePreview: (
        pipelineId: string,
        previewData: Omit<PipelinePreviewImage, 'pipelineId' | 'timestamp'>
      ) => {
        set((state) => ({
          pipelinePreviews: {
            ...state.pipelinePreviews,
            [pipelineId]: {
              ...previewData,
              pipelineId,
              timestamp: Date.now(),
            },
          },
          activePreviewId: pipelineId,
        }));
      },

      getPipelinePreview: (pipelineId: string) => {
        const state = get();
        return state.pipelinePreviews[pipelineId] || null;
      },

      hasPipelinePreview: (pipelineId: string) => {
        const state = get();
        return !!state.pipelinePreviews[pipelineId];
      },

      clearPipelinePreview: (pipelineId: string) => {
        set((state) => {
          const newPreviews = { ...state.pipelinePreviews };
          delete newPreviews[pipelineId];

          return {
            pipelinePreviews: newPreviews,
            activePreviewId: state.activePreviewId === pipelineId ? null : state.activePreviewId,
          };
        });
      },

      clearAllPipelinePreviews: () => {
        set(initialState);
      },

      getMostRecentPipelinePreview: (pipelineId: string) => {
        const state = get();
        const preview = state.pipelinePreviews[pipelineId];
        if (!preview) {
          return null;
        }

        return preview;
      },
    }),
    {
      name: 'pipeline-previews-storage',
      partialize: (state) => ({
        pipelinePreviews: state.pipelinePreviews,
        activePreviewId: state.activePreviewId,
      }),
    }
  )
);

export default usePipelinePreviewStore;
