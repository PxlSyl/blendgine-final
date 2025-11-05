import React from 'react';
import { PlayIcon, PauseIcon, NextIcon, PreviousIcon } from '@/components/icons/PlayPause';
import { Tooltip } from '@/components/shared/ToolTip';

interface ZoomEffectsTimelineProps {
  isAnimatedImage: boolean;
  mimeType: string;
  maxFrames: number;
  currentFrame: number;
  isPlaying: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onTogglePlayPause: () => void;
  onNextFrame: () => void;
  onPreviousFrame: () => void;
  onFrameChange: (frame: number) => void;
}

const ZoomEffectsTimeline: React.FC<ZoomEffectsTimelineProps> = ({
  isAnimatedImage,
  mimeType,
  maxFrames,
  currentFrame,
  isPlaying,
  videoRef,
  onTogglePlayPause,
  onNextFrame,
  onPreviousFrame,
  onFrameChange,
}) => {
  if (!(isAnimatedImage || mimeType.startsWith('video/')) || maxFrames <= 1) {
    return null;
  }

  return (
    <div className="flex justify-center items-center p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex items-center gap-4 max-w-md w-full">
        <div className="flex items-center gap-2">
          <Tooltip tooltip="Previous Frame">
            <button
              onClick={onPreviousFrame}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors cursor-pointer"
            >
              <PreviousIcon className="w-5 h-5" />
            </button>
          </Tooltip>
          <Tooltip tooltip={isPlaying ? 'Pause' : 'Play'}>
            <button
              onClick={onTogglePlayPause}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors cursor-pointer"
            >
              {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
            </button>
          </Tooltip>
          <Tooltip tooltip="Next Frame">
            <button
              onClick={onNextFrame}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors cursor-pointer"
            >
              <NextIcon className="w-5 h-5" />
            </button>
          </Tooltip>
        </div>
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min={0}
              max={Math.max(0, maxFrames - 1)}
              value={
                mimeType.startsWith('video/') && videoRef.current
                  ? (() => {
                      const videoProgress =
                        videoRef.current.currentTime / videoRef.current.duration;
                      if (videoProgress > 0.98) {
                        return maxFrames - 1;
                      } else {
                        return Math.round(videoProgress * (maxFrames - 1));
                      }
                    })()
                  : currentFrame
              }
              onChange={(e) => {
                const newValue = Number(e.target.value);
                if (mimeType.startsWith('video/') && videoRef.current) {
                  const newTime = (newValue / (maxFrames - 1)) * videoRef.current.duration;
                  const clampedTime = Math.min(newTime, videoRef.current.duration);
                  videoRef.current.currentTime = clampedTime;
                } else {
                  onFrameChange(newValue);
                }
              }}
              className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-1
                [&::-webkit-slider-thumb]:h-2
                [&::-webkit-slider-thumb]:rounded-none
                [&::-webkit-slider-thumb]:bg-[rgb(var(--color-quaternary))]
                [&::-webkit-slider-thumb]:hover:bg-[rgb(var(--color-quaternary-dark))]
                [&::-webkit-slider-thumb]:transition-colors
                [&::-moz-range-thumb]:appearance-none
                [&::-moz-range-thumb]:w-1
                [&::-moz-range-thumb]:h-2
                [&::-moz-range-thumb]:rounded-none
                [&::-moz-range-thumb]:bg-[rgb(var(--color-quaternary))]
                [&::-moz-range-thumb]:hover:bg-[rgb(var(--color-quaternary-dark))]
                [&::-moz-range-thumb]:transition-colors
                [&::-moz-range-thumb]:border-0"
              style={{
                background: `linear-gradient(to right, rgb(var(--color-secondary)) ${maxFrames > 1 ? (currentFrame / (maxFrames - 1)) * 100 : 0}%, #d1d5db ${maxFrames > 1 ? (currentFrame / (maxFrames - 1)) * 100 : 0}%)`,
              }}
            />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap min-w-18 text-right tabular-nums">
            {currentFrame + 1} / {maxFrames}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ZoomEffectsTimeline;
