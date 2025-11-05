import React, { useEffect } from 'react';

import { useZoomEffectsTheme } from './hooks/useZoomEffectsTheme';
import { useZoomEffectsEvents } from './hooks/useZoomEffectsEvents';
import { useZoomEffectsImage } from './hooks/useZoomEffectsImage';
import { useZoomEffectsAnimation } from './hooks/useZoomEffectsAnimation';
import { useZoomEffectsControls } from './hooks/useZoomEffectsControls';
import ZoomEffectsHeader from './components/ZoomEffectsHeader';
import ZoomEffectsViewer from './components/ZoomEffectsViewer';
import ZoomEffectsTimeline from './components/ZoomEffectsTimeline';

const ZoomEffects: React.FC = () => {
  useZoomEffectsTheme();

  const { imageData, convertedImageSrc, title } = useZoomEffectsEvents();

  const { mimeType, isAnimatedImage, extractedFrames, isExtractionComplete } = useZoomEffectsImage(
    imageData,
    convertedImageSrc,
    null
  );

  const {
    zoom,
    isDragging,
    position,
    isPlaying,
    currentFrame,
    maxFrames,
    fps,
    staticImageData,
    imgRef,
    videoRef,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleContextMenu,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleImageLoad,
    handleVideoLoad,
    togglePlayPause,
    handleNextFrame,
    handlePreviousFrame,
    setCurrentFrame,
    setStaticImageData,
  } = useZoomEffectsControls(
    1, // maxFrames - will be updated by image hook
    24, // fps - will be updated by image hook
    mimeType,
    isAnimatedImage,
    isExtractionComplete,
    extractedFrames,
    0, // currentFrame - will be managed by controls
    () => {}, // setCurrentFrame - will be provided by controls
    () => {}, // setStaticImageData - will be provided by controls
    () => {} // setConvertedImageSrc - not needed here
  );

  useZoomEffectsAnimation(
    isAnimatedImage,
    isPlaying,
    maxFrames,
    fps,
    extractedFrames,
    isExtractionComplete,
    currentFrame,
    setCurrentFrame,
    setStaticImageData
  );

  useEffect(() => {
    if (mimeType.startsWith('video/') && videoRef.current) {
      const video = videoRef.current;

      const handleTimeUpdate = () => {
        if (video.duration > 0) {
          const videoProgress = video.currentTime / video.duration;

          let frame;
          if (videoProgress > 0.98) {
            frame = maxFrames - 1;
          } else {
            frame = Math.round(videoProgress * (maxFrames - 1));
          }

          const clampedFrame = Math.max(0, Math.min(frame, maxFrames - 1));
          setCurrentFrame(clampedFrame);
        }
      };

      video.addEventListener('timeupdate', handleTimeUpdate);

      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [mimeType, maxFrames, videoRef, setCurrentFrame]);

  return (
    <div className="flex flex-col h-full">
      <ZoomEffectsHeader
        title={title}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
      />

      <ZoomEffectsViewer
        mimeType={mimeType}
        convertedImageSrc={convertedImageSrc}
        title={title}
        zoom={zoom}
        position={position}
        isDragging={isDragging}
        staticImageData={staticImageData}
        isPlaying={isPlaying}
        imgRef={imgRef}
        videoRef={videoRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        onImageLoad={handleImageLoad}
        onVideoLoad={handleVideoLoad}
      />

      <ZoomEffectsTimeline
        isAnimatedImage={isAnimatedImage}
        mimeType={mimeType}
        maxFrames={maxFrames}
        currentFrame={currentFrame}
        isPlaying={isPlaying}
        videoRef={videoRef}
        onTogglePlayPause={togglePlayPause}
        onNextFrame={handleNextFrame}
        onPreviousFrame={handlePreviousFrame}
        onFrameChange={setCurrentFrame}
      />
    </div>
  );
};

export default ZoomEffects;
