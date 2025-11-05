import React from 'react';
import { PictureIcon } from '@/components/icons/imageIcons';
import LockButton from '@/components/shared/LockButton';
import EmptyPreviewPlaceholder from './EmptyPreviewPlaceholder';

interface CanvasFallbackViewerProps {
  previewImage: string | null;
  isSourceImageLocked: boolean;
  isGenerating: boolean;
  maxSize: number;
  toggleSourceImageLock: () => void;
}

const CanvasFallbackViewer: React.FC<CanvasFallbackViewerProps> = ({
  previewImage,
  isSourceImageLocked,
  isGenerating,
  maxSize,
  toggleSourceImageLock,
}) => {
  return (
    <>
      <div className="mb-2 pb-2 border-b border-gray-200 dark:border-gray-700 h-10">
        <div className="font-bold leading-6 text-gray-900 dark:text-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[rgb(var(--color-primary))]">
            <PictureIcon className="w-4 sm:w-5 h-4 sm:h-5 text-[rgb(var(--color-secondary))]" />
            Preview
          </div>
          <div className="w-8 h-8">
            {previewImage && (
              <LockButton
                locked={isSourceImageLocked}
                onClick={toggleSourceImageLock}
                disabled={isGenerating}
                className="w-8 h-8 p-0"
                locktext={false}
                tooltipText={{
                  locked: 'Unlock source image for reuse',
                  unlocked: 'Lock source image for reuse',
                }}
              />
            )}
          </div>
        </div>
      </div>

      <div className="w-full h-[calc(100vh-100px)] xs:max-h-[60vh]">
        <div
          className="w-full h-full rounded-lg overflow-hidden dark:bg-gray-800 bg-gray-100 flex items-stretch relative"
          style={{ cursor: 'crosshair' }}
        >
          <div
            className="absolute inset-0 bg-[size:20px_20px] bg-[linear-gradient(to_right,#E5E7EB_1px,transparent_1px),linear-gradient(to_bottom,#E5E7EB_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#374151_1px,transparent_1px),linear-gradient(to_bottom,#374151_1px,transparent_1px)] z-0"
            style={{
              width: '100%',
              height: '100%',
              minWidth: '100%',
              minHeight: '100%',
            }}
          />

          {!previewImage ? (
            <EmptyPreviewPlaceholder className="absolute inset-0 z-10" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <canvas
                width={maxSize}
                height={maxSize}
                style={{
                  width: `${maxSize}px`,
                  height: `${maxSize}px`,
                }}
              />
            </div>
          )}

          {isGenerating && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-20">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[rgb(var(--color-primary))]" />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CanvasFallbackViewer;
