import React, { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';

import { useGenerateStore } from '@/components/store/generate';

import GeneratingAnimation from './GeneratingAnimation';
import ApplyingFiltersAnimation from './ApplyingFiltersAnimation';

const AnimationOverlay = React.memo(() => {
  const {
    isApplyingFilters,
    filterState,
    generationState,
    showDots,
    showConfetti,
    backToMenu,
    handleQuit,
    isCancelling,
    setIsCancelling,
  } = useGenerateStore();

  useEffect(() => {
    const setupListeners = async () => {
      const unlistenCancelling = await listen('generation-cancelling', () => {
        setIsCancelling(true);
      });

      const unlistenCancelled = await listen('nft-generation-cancelled', () => {
        setIsCancelling(false);
      });

      return () => {
        unlistenCancelling();
        unlistenCancelled();
      };
    };

    setupListeners().catch((error) => {
      console.error('Error setting up animation listeners:', error);
    });
  }, [setIsCancelling]);

  if (isApplyingFilters || filterState === 'success' || filterState === 'cancelled') {
    return (
      <ApplyingFiltersAnimation
        showDots={showDots}
        showConfetti={showConfetti}
        showSuccessScreen={filterState === 'success'}
        onBackToMenu={backToMenu}
        onQuit={handleQuit}
      />
    );
  }

  if (
    generationState.status === 'generating' ||
    generationState.status === 'completed' ||
    generationState.status === 'cancelled' ||
    isCancelling
  ) {
    return (
      <GeneratingAnimation
        showDots={showDots}
        showConfetti={showConfetti}
        showSuccessScreen={generationState.status === 'completed'}
        onBackToMenu={backToMenu}
        onQuit={handleQuit}
      />
    );
  }

  return null;
});

AnimationOverlay.displayName = 'AnimationOverlay';

export default AnimationOverlay;
