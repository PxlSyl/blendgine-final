import React from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';

interface CanvasViewerProps {
  previewImage: string | null;
  originalImage: string | null;
  mimeType: string;
  originalMimeType: string;
  maxSize: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  sliderPosition: number;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  isGenerating: boolean;
}

const CanvasViewer: React.FC<CanvasViewerProps> = ({
  previewImage,
  originalImage,
  mimeType,
  originalMimeType,
  maxSize,
  containerRef,
  sliderPosition,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  isGenerating,
}) => {
  if (!previewImage || !originalImage) {
    return (
      <div className="h-[calc(100vh-100px)] aspect-square mx-auto xs:max-h-[60vh] flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">
          {(() => {
            return 'Failed to generate preview';
          })()}
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full rounded-lg overflow-hidden dark:bg-gray-800 bg-gray-100 flex items-stretch relative"
      style={{ cursor: 'crosshair' }}
    >
      <div className="absolute inset-0 bg-[size:20px_20px] bg-[linear-gradient(to_right,#E5E7EB_1px,transparent_1px),linear-gradient(to_bottom,#E5E7EB_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#374151_1px,transparent_1px),linear-gradient(to_bottom,#374151_1px,transparent_1px)]" />
      <div
        ref={containerRef}
        className="h-[calc(100vh-100px)] aspect-square mx-auto xs:max-h-[60vh] relative"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
      >
        <div className="w-full h-full">
          <div className="absolute inset-0 flex items-center justify-center">
            {mimeType.startsWith('video/') ? (
              <video
                src={convertFileSrc(previewImage)}
                style={{
                  width: `${maxSize}px`,
                  height: `${maxSize}px`,
                  objectFit: 'contain',
                  imageRendering: 'pixelated',
                }}
                autoPlay
                loop
                muted
                controls
              />
            ) : (
              <img
                src={convertFileSrc(previewImage)}
                alt="Preview"
                style={{
                  width: `${maxSize}px`,
                  height: `${maxSize}px`,
                  objectFit: 'contain',
                  imageRendering: 'pixelated',
                }}
              />
            )}
          </div>
        </div>

        <div
          className="absolute inset-0"
          style={{
            clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
          }}
        >
          <div className="w-full h-full">
            <div className="absolute inset-0 flex items-center justify-center">
              {originalMimeType.startsWith('video/') ? (
                <video
                  src={convertFileSrc(originalImage)}
                  style={{
                    width: `${maxSize}px`,
                    height: `${maxSize}px`,
                    objectFit: 'contain',
                    imageRendering: 'pixelated',
                  }}
                  autoPlay
                  loop
                  muted
                  controls
                />
              ) : (
                <img
                  src={convertFileSrc(originalImage)}
                  alt="Original"
                  style={{
                    width: `${maxSize}px`,
                    height: `${maxSize}px`,
                    objectFit: 'contain',
                    imageRendering: 'pixelated',
                  }}
                />
              )}
            </div>
          </div>
        </div>

        <div
          className="absolute top-0 bottom-0 w-1 bg-[rgb(var(--color-secondary))] cursor-ew-resize pointer-events-auto"
          style={{
            left: `${sliderPosition}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[rgb(var(--color-secondary))] shadow-lg flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-[rgb(var(--color-primary))] flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-[rgb(var(--color-accent))]" />
            </div>
          </div>
        </div>
      </div>
      {isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-10">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[rgb(var(--color-primary))]" />
        </div>
      )}
    </div>
  );
};

export default CanvasViewer;
