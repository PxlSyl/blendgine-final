import React from 'react';

interface ZoomEffectsViewerProps {
  mimeType: string;
  convertedImageSrc: string | null;
  title: string;
  zoom: number;
  position: { x: number; y: number };
  isDragging: boolean;
  staticImageData: string | null;
  isPlaying: boolean;
  imgRef: React.RefObject<HTMLImageElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onWheel: (e: React.WheelEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onImageLoad: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  onVideoLoad: (event: React.SyntheticEvent<HTMLVideoElement>) => void;
}

const ZoomEffectsViewer: React.FC<ZoomEffectsViewerProps> = ({
  mimeType,
  convertedImageSrc,
  title,
  zoom,
  position,
  isDragging,
  staticImageData,
  isPlaying,
  imgRef,
  videoRef,
  onWheel,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onContextMenu,
  onImageLoad,
  onVideoLoad,
}) => {
  return (
    <div
      className="flex-1 relative overflow-hidden bg-gray-100 dark:bg-gray-800"
      onWheelCapture={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onContextMenu={onContextMenu}
    >
      <div className="absolute inset-0 bg-size-[20px_20px] bg-[linear-gradient(to_right,#E5E7EB_1px,transparent_1px),linear-gradient(to_bottom,#E5E7EB_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#374151_1px,transparent_1px),linear-gradient(to_bottom,#374151_1px,transparent_1px)]" />
      <div
        style={{
          transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? 'grabbing' : 'zoom-in',
        }}
        className="absolute inset-0 flex items-center justify-center transition-transform duration-100"
      >
        {mimeType.startsWith('video/') ? (
          <video
            ref={videoRef}
            src={convertedImageSrc ?? ''}
            className="zoom-image max-w-full max-h-full object-contain"
            style={{
              imageRendering: 'pixelated',
            }}
            autoPlay
            loop
            muted
            onLoadedMetadata={onVideoLoad}
          />
        ) : mimeType === 'image/gif' ? (
          <div className="relative">
            <img
              ref={imgRef}
              src={convertedImageSrc ?? ''}
              alt={title}
              className="zoom-image max-w-full max-h-full object-contain"
              style={{
                imageRendering: 'pixelated',
                opacity: isPlaying ? 1 : 0,
              }}
              onLoad={onImageLoad}
            />
            {!isPlaying && staticImageData && (
              <img
                src={staticImageData}
                alt={title}
                className="zoom-image max-w-full max-h-full object-contain absolute top-0 left-0"
                style={{
                  imageRendering: 'pixelated',
                }}
              />
            )}
          </div>
        ) : (
          <img
            src={convertedImageSrc ?? ''}
            alt={title}
            className="zoom-image max-w-full max-h-full object-contain"
            style={{
              imageRendering: 'pixelated',
            }}
            onLoad={onImageLoad}
          />
        )}
      </div>
    </div>
  );
};

export default ZoomEffectsViewer;
