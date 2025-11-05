import { useImperativeHandle, ForwardedRef } from 'react';
import { FilterInstance } from '@/types/effect';

interface GeneratePreviewParams {
  activePreview: string;
  effects: FilterInstance[];
  sourceFolder: string;
  isSourceImageLocked: boolean;
  exportFormat?: string;
  isAnimated?: boolean;
  pipelineId?: string;
}

interface UseCanvasGenerationProps {
  filters: readonly FilterInstance[];
  sourceFolder: string | null;
  previewImage: string | null;
  storeGeneratePreview: (params: GeneratePreviewParams) => Promise<void>;
  isSourceImageLocked: boolean;
  exportFormat: string;
  isAnimated: boolean;
}

export const useCanvasGeneration = ({
  filters,
  sourceFolder,
  previewImage,
  storeGeneratePreview,
  isSourceImageLocked,
  exportFormat,
  isAnimated,
}: UseCanvasGenerationProps) => {
  const handleGenerate = () => {
    if (!sourceFolder) {
      return;
    }

    void storeGeneratePreview({
      activePreview: 'Filters',
      effects: [...filters],
      sourceFolder,
      isSourceImageLocked,
      exportFormat,
      isAnimated,
    });
  };

  const isGenerateDisabled = !sourceFolder;
  const isZoomDisabled = !previewImage;

  const useCreateImperativeHandle = (
    ref: ForwardedRef<{ generatePreview: () => Promise<void> }>
  ) => {
    useImperativeHandle(ref, () => ({
      generatePreview: () => {
        if (!sourceFolder) {
          return Promise.resolve();
        }

        return storeGeneratePreview({
          activePreview: 'Filters',
          effects: [...filters],
          sourceFolder,
          isSourceImageLocked,
          exportFormat,
          isAnimated,
        });
      },
    }));
  };

  return {
    handleGenerate,
    isGenerateDisabled,
    isZoomDisabled,
    useCreateImperativeHandle,
  };
};
