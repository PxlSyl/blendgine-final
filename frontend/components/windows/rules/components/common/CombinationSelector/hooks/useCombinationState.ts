import { useMemo } from 'react';

interface UseCombinationStateProps {
  checkSelectionValid: () => boolean;
  validationError?: string | null;
}

export const useCombinationState = ({
  checkSelectionValid,
  validationError,
}: UseCombinationStateProps) => {
  const isSelectionValid = useMemo(() => {
    return checkSelectionValid() && !validationError;
  }, [checkSelectionValid, validationError]);

  return {
    isSelectionValid,
  };
};
