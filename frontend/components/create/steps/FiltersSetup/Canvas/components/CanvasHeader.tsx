import React from 'react';
import { PictureIcon } from '@/components/icons/imageIcons';
import LockButton from '@/components/shared/LockButton';

interface CanvasHeaderProps {
  isGenerating: boolean;
  previewImage: string | null;
  isSourceImageLocked: boolean;
  onToggleSourceImageLock: () => void;
}

const CanvasHeader: React.FC<CanvasHeaderProps> = ({
  isGenerating,
  previewImage,
  isSourceImageLocked,
  onToggleSourceImageLock,
}) => {
  return (
    <div className="mb-2 pb-2 border-b border-gray-200 dark:border-gray-700 h-10">
      <div className="font-bold leading-6 text-gray-900 dark:text-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[rgb(var(--color-primary))]">
          <PictureIcon className="w-4 sm:w-5 h-4 sm:h-5 text-[rgb(var(--color-secondary))]" />
          Preview
        </div>
        <div className="flex items-center space-x-2">
          {previewImage && (
            <div className="ml-2">
              <LockButton
                locked={isSourceImageLocked}
                onClick={onToggleSourceImageLock}
                disabled={isGenerating}
                className="w-8 h-8 p-0"
                locktext={false}
                tooltipText={{
                  locked: 'Unlock source image for reuse',
                  unlocked: 'Lock source image for reuse',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CanvasHeader;
