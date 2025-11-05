import React from 'react';
import { Tooltip } from '@/components/shared/ToolTip';

interface ControlButtonProps {
  onClick: () => void;
  disabled?: boolean;
  tooltip: string;
  icon: React.ReactNode;
  color: string;
}

export const ControlButton: React.FC<ControlButtonProps> = ({
  onClick,
  disabled,
  tooltip,
  icon,
  color,
}) => {
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center w-6 h-6 rounded-full border border-gray-300 hover:bg-gray-300 dark:border-none dark:bg-gray-700 dark:hover:bg-gray-600 ${disabledClass}`}
    >
      <Tooltip tooltip={tooltip}>
        {React.cloneElement(
          icon as React.ReactElement,
          {
            className: `w-4 h-4 ${color === 'blue' ? 'text-[rgb(var(--color-accent))]' : color === 'purple' ? 'text-[rgb(var(--color-primary))]' : 'text-[rgb(var(--color-secondary))]'}`,
          } as React.Attributes & { className?: string }
        )}
      </Tooltip>
    </button>
  );
};
