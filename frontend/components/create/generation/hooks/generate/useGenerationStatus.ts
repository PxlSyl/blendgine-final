import { useEffect } from 'react';
import { useGenerateStore } from '@/components/store/generate';

export const useGenerationStatus = () => {
  const { setPaused } = useGenerateStore();

  useEffect(() => {
    let unlistenFn: (() => void) | null = null;

    window.__TAURI__.event
      .listen('nft-generation-status', (event) => {
        const { status } = event.payload as { status: 'paused' | 'resumed' };
        setPaused(status === 'paused');
      })
      .then((unlisten) => {
        unlistenFn = unlisten;
      })
      .catch((error) => {
        console.error('Error listening to nft-generation-status:', error);
      });

    return () => {
      if (unlistenFn) {
        unlistenFn();
      }
    };
  }, [setPaused]);
};
