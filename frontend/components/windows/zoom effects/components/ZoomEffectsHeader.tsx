import React from 'react';
import { FilterName } from '@/types/effect';
import { PictureIcon } from '@/components/icons/imageIcons';
import { getFilterDisplayName } from '@/components/store/filters/main/utils/filterUtils';
import { ZoomControls } from '@/components/shared/ZoomUI/ZoomControls';
import { ZoomButton } from '@/components/shared/ZoomUI/ZoomButton';

interface ZoomEffectsHeaderProps {
  title: string;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

const ZoomEffectsHeader: React.FC<ZoomEffectsHeaderProps> = ({
  title,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 text-[rgb(var(--color-primary))]">
        <PictureIcon className="w-4 sm:w-5 h-4 sm:h-5 text-[rgb(var(--color-secondary))]" />
        <h2 className="text-lg font-semibold">
          {title.startsWith('Filter: ')
            ? `Filter: ${getFilterDisplayName(title.replace('Filter: ', '') as FilterName)}`
            : title}
        </h2>
      </div>
      <div className="flex items-center gap-2">
        <ZoomControls zoom={zoom} onZoomIn={onZoomIn} onZoomOut={onZoomOut} />
        <ZoomButton label="Reset" onClick={onResetZoom} color="red" />
      </div>
    </div>
  );
};

export default ZoomEffectsHeader;
