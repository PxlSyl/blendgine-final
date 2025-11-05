import React, { useEffect } from 'react';

import { useGenerateStore } from '@/components/store/generate';
import {
  useWebPPause,
  useFilterProgress,
  useFilterActions,
  useFilterStatus,
  useFilterData,
} from './hooks';
import { useFileWatcher } from './hooks/generate/useFileWatcher';

import { GenerationStateLayout } from './layouts/GenerationStateLayout';
import { GeneratedImagesGrid } from './components/GeneratedImagesGrid';
import { GenerationConsole } from './components/GenerationConsole';
import { ProgressBar } from './components/ProgressBar';
import SuccessScreen from './SuccessScreen';

interface ApplyingFiltersAnimationProps {
  showDots: boolean;
  showConfetti: boolean;
  showSuccessScreen: boolean;
  onBackToMenu: () => void;
  onQuit: () => void;
}

const ApplyingFiltersAnimation: React.FC<ApplyingFiltersAnimationProps> = ({
  showDots,
  showConfetti,
  showSuccessScreen,
  onBackToMenu,
  onQuit,
}) => {
  const { isPaused } = useGenerateStore();
  const { filterState, setShowMenu } = useGenerateStore();

  useEffect(() => {
    if (filterState === 'cancelled') {
      setShowMenu(true);
    }
  }, [filterState, setShowMenu]);

  const originalSrc = './assets/blendgine_anim.webp';
  const canvasRef = useWebPPause({
    originalSrc,
    isPaused,
    width: 384,
    height: 384,
  });

  const { currentProgress } = useFilterProgress(isPaused);
  const { handlePauseToggle, handleCancel } = useFilterActions();
  useFilterStatus();
  const { sortedConsoleMessages } = useFilterData();

  const { getLastFile } = useFileWatcher();
  const lastFile = getLastFile();

  const isProcessing = filterState === 'applying';

  return (
    <GenerationStateLayout>
      <div className="flex flex-col lg:flex-row w-full h-full">
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4 lg:p-8">
          {showSuccessScreen ? (
            <SuccessScreen
              message="Filters applied successfully!"
              showConfetti={showConfetti}
              onBackToMenu={onBackToMenu}
              onQuit={onQuit}
            />
          ) : (
            <div className="flex flex-col items-center">
              <div className="relative w-64 h-64 lg:w-96 lg:h-96 mb-8">
                {!isPaused && (
                  <img
                    src={originalSrc}
                    alt="Blendgine Logo"
                    className="absolute top-0 left-0 w-full h-full object-contain"
                  />
                )}
                <canvas
                  ref={canvasRef}
                  width={384}
                  height={384}
                  className={`absolute top-0 left-0 w-full h-full object-contain ${
                    isPaused ? 'visible' : 'invisible'
                  }`}
                />
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-wide font-title text-transparent bg-clip-text bg-gradient-to-r from-[rgb(var(--color-primary-light))] to-[rgb(var(--color-secondary-dark))] animate-pulse mb-8">
                {isPaused ? 'Paused' : 'Applying Filters'}
              </h1>
              <div className="w-full max-w-md">
                <ProgressBar
                  sequenceNumber={currentProgress.sequenceNumber}
                  totalCount={currentProgress.totalCount}
                  label="Artworks processed"
                />
                {isPaused ? (
                  <div className="mt-4 w-full py-2 px-4 bg-gray-500 text-white font-semibold rounded-sm text-center">
                    Processing Paused
                  </div>
                ) : (
                  <button
                    onClick={() => void handleCancel()}
                    className="mt-4 w-full py-2 px-4 bg-[rgb(var(--color-secondary))] text-white font-semibold rounded-sm shadow-md hover:bg-[rgb(var(--color-secondary-dark))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-quaternary)/0.75)] cursor-pointer"
                  >
                    Cancel Filter Application
                  </button>
                )}
                <div className="h-[40px] mt-8 flex justify-center">
                  {showDots && !isPaused && filterState !== 'cancelled' && (
                    <div className="flex justify-center">
                      <span className="dot"></span>
                      <span className="dot"></span>
                      <span className="dot"></span>
                      <span className="dot"></span>
                      <span className="dot"></span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="w-full lg:w-1/2 border-l border-gray-700 flex flex-col h-full">
          <div className="flex-1 min-h-0 overflow-hidden relative flex items-center justify-center">
            <div className="absolute inset-0 bg-[size:20px_20px] bg-[linear-gradient(to_right,#E5E7EB_1px,transparent_1px),linear-gradient(to_bottom,#E5E7EB_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#374151_1px,transparent_1px),linear-gradient(to_bottom,#374151_1px,transparent_1px)]" />
            <div className="relative z-10">
              <GeneratedImagesGrid file={lastFile} />
            </div>
          </div>
          <div className="h-1/3 min-h-[250px] border-t border-gray-700">
            <GenerationConsole
              messages={sortedConsoleMessages}
              onPauseToggle={(isPaused) => void handlePauseToggle(isPaused)}
              isPaused={isPaused}
              isProcessing={isProcessing}
            />
          </div>
        </div>
      </div>
    </GenerationStateLayout>
  );
};

export default ApplyingFiltersAnimation;
