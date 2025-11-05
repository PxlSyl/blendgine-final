import React from 'react';
import { Tooltip } from '@/components/shared/ToolTip';
import { ImageIcon, CubeIcon, RefreshIcon, ZoomIcon } from '@/components/icons';
import NumericStepper from '@/components/shared/NumericStepper';
import HeaderButton from '@/components/shared/HeaderButton';
import { PlayIcon, PauseIcon, NextIcon, PreviousIcon } from '@/components/icons/PlayPause';
import { usePreviewButtons } from './usePreviewButtons';

interface PreviewButtonsProps {
  viewMode: '2d' | '3d';
  setViewMode: (mode: '2d' | '3d') => void;
  isGenerating: boolean;
  handleRefresh: () => void;
  isAnimatedCollection: boolean;
  fps?: number;
  setFPS?: (value: number) => void;
}

const PreviewButtons: React.FC<PreviewButtonsProps> = ({
  viewMode,
  setViewMode,
  isGenerating,
  handleRefresh,
  isAnimatedCollection,
  fps = 24,
  setFPS = () => {},
}) => {
  const {
    isWindowOpen,
    maxFrames,
    currentFrame,
    animationState,
    handleOpenZoomWindow,
    handleViewModeChange,
    handlePlayPause,
    handleNextFrame,
    handlePreviousFrame,
  } = usePreviewButtons({
    setViewMode,
    isAnimatedCollection,
    fps,
  });

  const handleGenerate = () => {
    handleRefresh();
  };

  return (
    <div className="flex-none p-2 rounded-sm shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-[rgb(var(--color-primary)/0.2)] dark:border-gray-700/50">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex space-x-1 flex-wrap gap-1">
          <Tooltip tooltip="Zoom">
            <HeaderButton
              isActive={isWindowOpen}
              onClick={handleOpenZoomWindow}
              icon={<ZoomIcon className="w-4 h-4" />}
              disabled={isGenerating}
            >
              Zoom
            </HeaderButton>
          </Tooltip>
          <Tooltip tooltip="Ctrl + 2">
            <HeaderButton
              isActive={viewMode === '2d'}
              onClick={() => handleViewModeChange('2d')}
              icon={<ImageIcon className="w-4 h-4" />}
              disabled={isGenerating}
            >
              2D
            </HeaderButton>
          </Tooltip>

          <Tooltip tooltip="Ctrl + 3">
            <HeaderButton
              isActive={viewMode === '3d'}
              onClick={() => handleViewModeChange('3d')}
              icon={<CubeIcon className="w-4 h-4" />}
              disabled={isGenerating}
            >
              3D
            </HeaderButton>
          </Tooltip>

          <Tooltip tooltip="Shift + G">
            <HeaderButton
              isActive={true}
              onClick={handleGenerate}
              icon={<RefreshIcon className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />}
              variant="pink"
              disabled={isGenerating}
            >
              Generate
            </HeaderButton>
          </Tooltip>
        </div>

        {isAnimatedCollection && (
          <div className="w-full sm:w-auto flex items-center h-[34px]">
            <div
              className="rounded-sm overflow-hidden transition-all duration-200 bg-gradient-to-b from-[rgb(var(--color-primary)/0.1)] to-[rgb(var(--color-primary)/0.2)] dark:from-gray-700 dark:to-gray-800 flex items-center h-full"
              style={{
                boxShadow:
                  'inset 0 1px 0 0 rgba(255,255,255,0.4), inset 0 -2px 2px rgba(0,0,0,0.2), inset -2px 0 2px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.2)',
                border: '1px solid rgb(var(--color-primary)/0.5)',
              }}
            >
              <div className="flex items-center px-2 h-full">
                <div className="flex items-center gap-1">
                  <Tooltip tooltip="Previous Frame">
                    <button
                      onClick={handlePreviousFrame}
                      disabled={isGenerating}
                      className="p-1.5 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full disabled:opacity-50 disabled:cursor-not-allowed text-[rgb(var(--color-primary))] cursor-pointer"
                    >
                      <PreviousIcon className="w-4 h-4" />
                    </button>
                  </Tooltip>
                  <Tooltip tooltip={animationState.isPaused ? 'Play' : 'Pause'}>
                    <button
                      onClick={handlePlayPause}
                      disabled={isGenerating}
                      className="p-1.5 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full disabled:opacity-50 disabled:cursor-not-allowed text-[rgb(var(--color-primary))] cursor-pointer"
                    >
                      {animationState.isPaused ? (
                        <PlayIcon className="w-4 h-4" />
                      ) : (
                        <PauseIcon className="w-4 h-4" />
                      )}
                    </button>
                  </Tooltip>
                  <Tooltip tooltip="Next Frame">
                    <button
                      onClick={handleNextFrame}
                      disabled={isGenerating}
                      className="p-1.5 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full disabled:opacity-50 disabled:cursor-not-allowed text-[rgb(var(--color-primary))] cursor-pointer"
                    >
                      <NextIcon className="w-4 h-4" />
                    </button>
                  </Tooltip>
                </div>
                <div
                  className={`text-sm font-medium text-[rgb(var(--color-primary))] whitespace-nowrap w-16 text-right tabular-nums -ml-1 pr-1 ${isGenerating ? 'opacity-50' : ''}`}
                >
                  {currentFrame + 1} / {maxFrames}
                </div>
                <div className="pl-2 h-full flex items-center">
                  <NumericStepper
                    value={fps}
                    onChange={setFPS}
                    min={1}
                    max={60}
                    label="FPS"
                    disabled={isGenerating}
                    bgColorClass="bg-white/70 dark:bg-gray-800"
                    hoverBgColorClass="hover:bg-white dark:hover:bg-gray-700"
                    inputClassName="w-10 text-xs h-[26px] text-gray-800 dark:text-gray-200"
                    buttonClassName="w-7 h-[26px] flex items-center justify-center text-[rgb(var(--color-primary))]"
                    labelClassName="text-xs font-medium text-[rgb(var(--color-primary))] dark:text-[rgb(var(--color-primary-dark))]"
                    containerClassName="flex items-center gap-2"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewButtons;
