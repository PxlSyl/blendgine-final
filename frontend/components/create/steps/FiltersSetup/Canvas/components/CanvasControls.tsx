import React from 'react';
import { RefreshIcon, ZoomIcon } from '@/components/icons';
import HeaderButton from '@/components/shared/HeaderButton';
import { Tooltip } from '@/components/shared/ToolTip';

interface CanvasControlsProps {
  isGenerateDisabled: boolean;
  isZoomDisabled: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
  onZoom: () => void;
}

const CanvasControls: React.FC<CanvasControlsProps> = ({
  isGenerateDisabled,
  isZoomDisabled,
  isGenerating,
  onGenerate,
  onZoom,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="grow p-2 rounded-sm shadow-lg dark:bg-gray-800/50 dark:border-gray-700/50 bg-white/50 backdrop-blur-sm border border-[rgb(var(--color-primary)/0.2)]">
        <div className="flex space-x-1 flex-wrap gap-1">
          <Tooltip tooltip="Zoom">
            <div
              className={`${isZoomDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <HeaderButton
                isActive={!isZoomDisabled}
                onClick={isZoomDisabled ? () => {} : onZoom}
                icon={<ZoomIcon className="w-4 h-4" />}
              >
                Zoom
              </HeaderButton>
            </div>
          </Tooltip>
          <Tooltip tooltip="Shift + G">
            <div
              className={`${isGenerateDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <HeaderButton
                isActive={!isGenerateDisabled}
                onClick={isGenerateDisabled ? () => {} : onGenerate}
                icon={<RefreshIcon className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />}
                variant="pink"
              >
                Generate
              </HeaderButton>
            </div>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default CanvasControls;
