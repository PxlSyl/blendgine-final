import React from 'react';
import { CameraIcon, JoystickIcon, LayersIcon } from '@/components/icons';
import { Tooltip } from '@/components/shared/ToolTip';
import Header3DControlsButton from './Header3DControlsButton';

interface HeaderProps {
  onCameraSwitch: () => void;
  onResetView: () => void;
  disabled?: boolean;
  cameraType: string;
}

export const Header: React.FC<HeaderProps> = ({
  onCameraSwitch,
  onResetView,
  disabled,
  cameraType,
}) => {
  return (
    <div className=" bg-gray-200 dark:bg-gray-800 rounded-sm border-b border-gray-300 dark:border-gray-700">
      <div className="flex items-center gap-1 shrink-0">
        <div className="flex items-center text-sm xs:text-md font-bold text-[rgb(var(--color-primary))] h-8 w-full rounded-sm px-2">
          <Tooltip tooltip="3D View Controls">
            <div className="flex items-center">
              <JoystickIcon className="w-6 h-6" />
              <span className="flex-1 px-2">3D Controls</span>
            </div>
          </Tooltip>
        </div>
        <Header3DControlsButton
          onClick={onCameraSwitch}
          disabled={disabled}
          icon={<CameraIcon className="w-4 h-4" />}
          tooltipText={`Switch to ${cameraType === 'perspective' ? 'Orthographic' : 'Perspective'} view`}
          color="purple"
        >
          {cameraType === 'perspective' ? 'Perspective' : 'Orthographic'}
        </Header3DControlsButton>

        <Header3DControlsButton
          onClick={onResetView}
          disabled={disabled}
          icon={<LayersIcon className="w-4 h-4" />}
          tooltipText="Reset to flat view"
          color="pink"
        >
          Flatten
        </Header3DControlsButton>
      </div>
    </div>
  );
};
