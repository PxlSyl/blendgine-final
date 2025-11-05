import React, { useEffect } from 'react';
import { FilterInstance } from '@/types/effect';

import { useFilters } from '@/components/store/filters/hook';
import { useZoomEffectsStore } from '@/components/windows/zoom effects/store';

import CanvasHeader from './components/CanvasHeader';
import CanvasControls from './components/CanvasControls';
import CanvasViewer from './components/CanvasViewer';
import CanvasFallbackViewer from './components/CanvasFallbackViewer';

import { useCanvasState } from './hooks/useCanvasState';
import { useCanvasEvents } from './hooks/useCanvasEvents';
import { useCanvasImageLoader } from './hooks/useCanvasImageLoader';
import { useCanvasGeneration } from './hooks/useCanvasGeneration';

interface PreviewCanvasProps {
  filters: readonly FilterInstance[];
  flipOptions?: {
    horizontalFlipPercentage: number;
    verticalFlipPercentage: number;
  };
}

const PreviewCanvas = React.forwardRef<
  { generatePreview: () => Promise<void> },
  PreviewCanvasProps
>(({ filters }, ref) => {
  const {
    sourceFolder,
    exportFormat,
    isAnimated,
    isGeneratingPreview,
    previewImage,
    originalImage,
    generatePreview: storeGeneratePreview,
    isSourceImageLocked,
    toggleSourceImageLock,
  } = useFilters();
  const { openZoomEffectsWindow } = useZoomEffectsStore();

  const {
    containerRef,
    animationRef,
    sliderPosition,
    setSliderPosition,
    isDragging,
    setIsDragging,
    maxSize,
  } = useCanvasState();

  const { handleMouseDown, handleMouseMove, handleMouseUp } = useCanvasEvents({
    containerRef,
    isDragging,
    setIsDragging,
    setSliderPosition,
  });

  const { previewState, originalState, isBothLoaded } = useCanvasImageLoader({
    previewImage,
    originalImage,
  });

  const { handleGenerate, isGenerateDisabled, isZoomDisabled, useCreateImperativeHandle } =
    useCanvasGeneration({
      filters,
      sourceFolder,
      previewImage,
      storeGeneratePreview,
      isSourceImageLocked,
      exportFormat,
      isAnimated,
    });

  useCreateImperativeHandle(ref);

  useEffect(() => {
    const currentAnimationRef = animationRef.current;
    return () => {
      if (currentAnimationRef) {
        cancelAnimationFrame(currentAnimationRef);
      }
    };
  }, [previewImage, originalImage, animationRef]);

  const handleZoomClick = () => {
    if (previewImage) {
      void openZoomEffectsWindow(previewImage, 'Preview');
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <CanvasControls
        isGenerateDisabled={isGenerateDisabled}
        isZoomDisabled={isZoomDisabled}
        isGenerating={isGeneratingPreview}
        onGenerate={handleGenerate}
        onZoom={handleZoomClick}
      />

      <div className="grow p-2 rounded-sm shadow-lg dark:bg-gray-800/50 dark:border-gray-700/50 bg-white/50 backdrop-blur-sm border border-purple-100 overflow-auto pb-11">
        <div className="flex flex-col h-full min-h-0">
          {previewImage && isBothLoaded ? (
            <>
              <CanvasHeader
                isGenerating={isGeneratingPreview}
                previewImage={previewImage}
                isSourceImageLocked={isSourceImageLocked}
                onToggleSourceImageLock={toggleSourceImageLock}
              />

              <div>
                <CanvasViewer
                  previewImage={previewImage}
                  originalImage={originalImage}
                  mimeType={previewState.mimeType}
                  originalMimeType={originalState.mimeType}
                  maxSize={maxSize}
                  containerRef={containerRef}
                  sliderPosition={sliderPosition}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  isGenerating={isGeneratingPreview}
                />
              </div>
            </>
          ) : (
            <CanvasFallbackViewer
              previewImage={previewImage}
              isSourceImageLocked={isSourceImageLocked}
              isGenerating={isGeneratingPreview}
              maxSize={maxSize}
              toggleSourceImageLock={toggleSourceImageLock}
            />
          )}
        </div>
      </div>
    </div>
  );
});

PreviewCanvas.displayName = 'PreviewCanvas';

export default PreviewCanvas;
