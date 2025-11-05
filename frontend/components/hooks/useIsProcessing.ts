import { useGenerateStore } from '@/components/store/generate';

export const useIsProcessing = () => {
  const { generationState, showSuccessScreen, isCancelling } = useGenerateStore();

  const isProcessing =
    generationState.status === 'generating' ||
    generationState.status === 'completed' ||
    showSuccessScreen ||
    isCancelling;

  return isProcessing;
};
