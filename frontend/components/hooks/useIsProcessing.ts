import { useGenerateStore } from '@/components/store/generate';

export const useIsProcessing = () => {
  const { generationState, filterState, showSuccessScreen, isCancelling } = useGenerateStore();

  const isProcessing =
    generationState.status === 'generating' ||
    generationState.status === 'completed' ||
    filterState === 'applying' ||
    filterState === 'success' ||
    showSuccessScreen ||
    isCancelling;

  return isProcessing;
};
