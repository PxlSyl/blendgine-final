import { useRef, useEffect, useCallback } from 'react';
import { Effect } from 'effect';
import { api } from '@/services';
import { useGenerateStore } from '@/components/store/generate';

export const useGenerationActions = () => {
  const { setPaused, addConsoleMessage } = useGenerateStore();
  const addConsoleMessageRef = useRef(addConsoleMessage);

  useEffect(() => {
    addConsoleMessageRef.current = addConsoleMessage;
  }, [addConsoleMessage]);

  const handlePauseToggle = useCallback(
    async (isPaused: boolean) => {
      setPaused(isPaused);
      await Effect.try({
        try: () => api.toggleGenerationPause(isPaused),
        catch: (error) => {
          console.error('Error toggling pause state:', error);
          addConsoleMessageRef.current({
            type: 'error',
            message: `Failed to ${isPaused ? 'pause' : 'resume'} generation: ${String(error)}`,
            sequenceNumber: 0,
          });
        },
      }).pipe(Effect.runPromise);
    },
    [setPaused]
  );

  return {
    handlePauseToggle,
  };
};
