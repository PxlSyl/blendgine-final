import React from 'react';

import { Tooltip } from '@/components/shared/ToolTip';
import { LockClosedIcon, LockOpenIcon } from '@/components/icons';

interface LockButtonProps {
  locked: boolean;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
  locktext?: boolean;
  tooltipText?: {
    locked: string;
    unlocked: string;
  };
}

const LockButton: React.FC<LockButtonProps> = ({
  locked,
  onClick,
  className = '',
  disabled = false,
  locktext = false,
  tooltipText,
}) => {
  const baseClasses = `
    flex items-center justify-center aspect-square rounded-sm
    disabled:opacity-80
  `;

  const colorClasses = locked
    ? 'bg-[rgb(var(--color-quaternary))] hover:bg-[rgb(var(--color-quaternary-dark))] text-white'
    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-[rgb(var(--color-quaternary))] hover:text-[rgb(var(--color-quaternary-dark))]';

  const defaultTooltipText = {
    locked: 'Unlock this element',
    unlocked: 'Lock this element',
  };

  const finalTooltipText = tooltipText ?? defaultTooltipText;
  const currentTooltip = locked ? finalTooltipText.locked : finalTooltipText.unlocked;

  return (
    <Tooltip tooltip={currentTooltip}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) {
            onClick();
          }
        }}
        className={`${baseClasses} ${colorClasses} ${className} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        disabled={disabled}
      >
        <div className="shrink-0 flex items-center justify-center">
          {locked ? <LockClosedIcon className="w-4 h-4" /> : <LockOpenIcon className="w-4 h-4" />}
        </div>
        {locktext && <span className="ml-1 grow text-center">{locked ? 'Unlock' : 'Lock'}</span>}
      </button>
    </Tooltip>
  );
};

export default LockButton;
