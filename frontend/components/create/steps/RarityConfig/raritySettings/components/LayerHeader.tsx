import React from 'react';

import { capitalize, removeFileExtension } from '@/utils/functionsUtils';

import { AttentionIcon, ChevronDownIcon, FolderIcon, InfoIcon } from '@/components/icons';
import LockButton from '@/components/shared/LockButton';
import { Tooltip } from '@/components/shared/ToolTip';

interface LayerHeaderProps {
  layer: string;
  isExpanded: boolean;
  isLayerLocked: boolean;
  layerUsageInfo: { text: string; isWarning: boolean };
  handleToggleLayer: (e: React.MouseEvent) => void;
  toggleLock: (layer: string) => void;
}

export const LayerHeader: React.FC<LayerHeaderProps> = ({
  layer,
  isExpanded,
  isLayerLocked,
  layerUsageInfo,
  handleToggleLayer,
  toggleLock,
}) => (
  <div className="flex flex-row justify-between items-center mb-1">
    <div
      className="w-full bg-gray-200 dark:bg-gray-700 rounded-sm p-1 cursor-pointer"
      onClick={handleToggleLayer}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleToggleLayer(e as unknown as React.MouseEvent);
        }
      }}
    >
      <div className="ml-2 py-1 flex flex-row items-center justify-between text-md font-medium text-[rgb(var(--color-secondary))]">
        <div className="flex items-center">
          <Tooltip tooltip={isExpanded ? 'Collapse layer' : 'Expand layer'}>
            <div className="flex items-center">
              <ChevronDownIcon
                className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? '' : '-rotate-90'}`}
              />
              <FolderIcon className="w-6 h-6 text-[rgb(var(--color-secondary))] ml-2" />
            </div>
          </Tooltip>
          <div className="ml-2">{`${capitalize(removeFileExtension(layer))}`}</div>
        </div>
        <div className="flex items-center">
          {layerUsageInfo.isWarning && <AttentionIcon className="w-5 h-5 mr-2 text-yellow-500" />}
          <Tooltip tooltip={layerUsageInfo.text}>
            <InfoIcon
              className={`w-5 h-5 mr-2 ${
                layerUsageInfo.isWarning ? 'text-yellow-500' : 'text-gray-600 dark:text-gray-400'
              }`}
            />
          </Tooltip>
        </div>
      </div>
    </div>
    <LockButton
      locked={isLayerLocked}
      onClick={() => toggleLock(layer)}
      locktext={false}
      className="py-2 px-1 ml-1 w-[40px]"
    />
  </div>
);
