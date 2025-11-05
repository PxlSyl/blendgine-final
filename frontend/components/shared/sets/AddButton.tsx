import React from 'react';

import { PlusCircleIcon } from '@/components/icons';
import { IconButton } from '@/components/shared/IconButton';

interface AddButtonProps {
  onClick: () => void;
  tooltip?: string;
  className?: string;
}

export const AddButton: React.FC<AddButtonProps> = ({
  onClick,
  tooltip = 'Add new set',
  className = '',
}) => {
  return (
    <div
      className={`py-2 px-1 rounded-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 shrink-0 ${className}`}
      style={{
        boxShadow:
          'inset 0 1px 0 0 rgba(255,255,255,0.4), inset 1px 0 0 rgba(255,255,255,0.3), inset -3px 0 3px rgba(0,0,0,0.1), inset 0 -3px 3px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid rgb(var(--color-primary) / 0.5)',
      }}
    >
      <IconButton
        icon={<PlusCircleIcon />}
        tooltip={tooltip}
        onClick={onClick}
        isActive={false}
        color="white"
        showBorder={false}
      />
    </div>
  );
};
