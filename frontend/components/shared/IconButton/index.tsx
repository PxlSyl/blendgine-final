import React from 'react';
import { Tooltip } from '@/components/shared/ToolTip';

interface IconButtonProps {
  icon: React.ReactNode;
  tooltip: string;
  onClick: (e: React.MouseEvent) => void;
  isActive: boolean;
  color: 'blue' | 'red' | 'white';
  showBorder?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  tooltip,
  onClick,
  isActive,
  color,
  showBorder = true,
}) => {
  const getColorClasses = () => {
    if (isActive) {
      switch (color) {
        case 'blue':
          return 'text-white hover:text-[rgb(var(--color-accent-light))]';
        case 'red':
          return 'text-white hover:text-[rgb(var(--color-quaternary-light))]';
        case 'white':
          return 'text-white';
      }
    } else {
      switch (color) {
        case 'blue':
          return 'text-[rgb(var(--color-primary))] dark:text-[rgb(var(--color-primary-light))] hover:text-[rgb(var(--color-accent))]';
        case 'red':
          return 'text-[rgb(var(--color-primary))] dark:text-[rgb(var(--color-primary-light))] hover:text-[rgb(var(--color-quaternary))]';
        case 'white':
          return 'text-[rgb(var(--color-primary))] dark:text-[rgb(var(--color-primary-light))] hover:text-[rgb(var(--color-secondary))]';
      }
    }
  };

  return (
    <Tooltip tooltip={tooltip}>
      <button
        onClick={onClick}
        className="h-full px-1.5 cursor-pointer flex items-center"
        style={showBorder ? { borderLeft: '1px solid rgba(0,0,0,0.1)' } : {}}
      >
        <div className={`w-4 h-4 ${getColorClasses()}`}>{icon}</div>
      </button>
    </Tooltip>
  );
};
