import { useCallback, useRef, useEffect } from 'react';
import { Effect } from 'effect';
import { useGenerateStore } from '@/components/store/generate';
import { api } from '@/services';

export const useFilterActions = () => {
  const { addConsoleMessage, setPaused } = useGenerateStore();
  const { handleFilterCancel } = useGenerateStore();

  const addConsoleMessageRef = useRef(addConsoleMessage);

  useEffect(() => {
    addConsoleMessageRef.current = addConsoleMessage;
  }, [addConsoleMessage]);

  const handlePauseToggle = useCallback(
    async (isPaused: boolean) => {
      setPaused(isPaused);
      await Effect.try({
        try: () => api.toggleFilterPause(isPaused),
        catch: (error) => {
          console.error('Error toggling pause state:', error);
          addConsoleMessageRef.current({
            type: 'error',
            message: `Failed to ${isPaused ? 'pause' : 'resume'} filter application: ${String(error)}`,
            sequenceNumber: 0,
          });
        },
      }).pipe(Effect.runPromise);
    },
    [setPaused]
  );

  return { handlePauseToggle, handleCancel: handleFilterCancel };
};
