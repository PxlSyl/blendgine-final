import React, { useRef, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { PictureIcon } from '@/components/icons/imageIcons';
import { PlayIcon, PauseIcon, NextIcon, PreviousIcon } from '@/components/icons/PlayPause';

import { ZoomButton } from '@/components/shared/ZoomUI/ZoomButton';
import { ZoomControls } from '@/components/shared/ZoomUI/ZoomControls';
import { Tooltip } from '@/components/shared/ToolTip';
import { useLayerOrderZoom } from './hooks/useLayerOrderZoom';
import { CanvasRenderer } from './components/CanvasRenderer';
import { api } from '@/services';

const LayerOrderZoom: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const initTheme = async () => {
      try {
        const darkMode = await api.getTheme();
        const colorTheme = await api.getColorTheme();
        document.documentElement.classList.toggle('dark', darkMode);
        document.documentElement.setAttribute('data-theme', colorTheme);
      } catch (error) {
        console.error('Error getting theme:', error);
      }
    };
    void initTheme();

    let cancelled = false;

    const unlistenPromise = listen('color-theme-changed', (event: { payload: string }) => {
      if (!cancelled) {
        document.documentElement.setAttribute('data-theme', event.payload);
      }
    });

    return () => {
      cancelled = true;
      unlistenPromise
        .then((unlistenFn) => {
          if (!cancelled && typeof unlistenFn === 'function') {
            unlistenFn();
          }
        })
        .catch(() => {
          // Silent fail for race conditions
        });
    };
  }, []);

  const {
    isAnimatedCollection,
    maxFrames,
    currentFrame,
    isPlaying,
    imagesLoading,
    zoom,
    position,
    isDragging,
    imageConfigs,
    imageCache,

    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleContextMenu,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleWheel,
    handlePlayPause,
    handleNextFrame,
    handlePreviousFrame,
  } = useLayerOrderZoom();

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-[rgb(var(--color-primary))]">
          <PictureIcon className="w-4 sm:w-5 h-4 sm:h-5 text-[rgb(var(--color-secondary))]" />
          <h2 className="text-lg font-semibold">Layers Zoom</h2>
        </div>
        <div className="flex items-center gap-2">
          <ZoomControls zoom={zoom} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />
          <Tooltip tooltip="Reset view">
            <ZoomButton label="Reset" onClick={handleResetZoom} color="red" />
          </Tooltip>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 min-h-0 relative overflow-hidden bg-gray-100 dark:bg-gray-800"
        onWheelCapture={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu}
        style={{ touchAction: 'none' }}
      >
        <div className="absolute inset-0 bg-[length:20px_20px] bg-[linear-gradient(to_right,#E5E7EB_1px,transparent_1px),linear-gradient(to_bottom,#E5E7EB_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#374151_1px,transparent_1px),linear-gradient(to_bottom,#374151_1px,transparent_1px)]" />
        <div
          style={{
            transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)`,
            cursor: isDragging ? 'grabbing' : 'zoom-in',
          }}
          className="absolute inset-0 flex items-center justify-center transition-transform duration-100"
        >
          <canvas
            ref={canvasRef}
            width={500}
            height={500}
            className="w-full h-full object-contain"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              imageRendering: 'pixelated',
            }}
          />
        </div>
      </div>

      <CanvasRenderer
        canvasRef={canvasRef}
        imageConfigs={imageConfigs}
        imageCache={imageCache}
        imagesLoading={imagesLoading}
        isAnimatedCollection={isAnimatedCollection}
        currentFrame={currentFrame}
        zoom={zoom}
      />

      {isAnimatedCollection && maxFrames > 1 && (
        <div className="flex justify-center items-center p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-4 max-w-md w-full">
            <div className="flex items-center gap-2">
              <Tooltip tooltip="Previous Frame">
                <button
                  onClick={handlePreviousFrame}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <PreviousIcon className="w-5 h-5" />
                </button>
              </Tooltip>
              <Tooltip tooltip={isPlaying ? 'Pause' : 'Play'}>
                <button
                  onClick={handlePlayPause}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
                </button>
              </Tooltip>
              <Tooltip tooltip="Next Frame">
                <button
                  onClick={handleNextFrame}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
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
                  max={maxFrames - 1}
                  value={currentFrame}
                  onChange={() => handleNextFrame()}
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
                    background: `linear-gradient(to right, rgb(var(--color-secondary)) ${(currentFrame / (maxFrames - 1)) * 100}%, #d1d5db ${(currentFrame / (maxFrames - 1)) * 100}%)`,
                  }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap min-w-[4.5rem] text-right tabular-nums">
                {currentFrame + 1} / {maxFrames}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LayerOrderZoom;
