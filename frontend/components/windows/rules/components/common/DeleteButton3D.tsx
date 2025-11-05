import React from 'react';

import { TrashIcon } from '@/components/icons';
import { Tooltip } from '@/components/shared/ToolTip';

interface DeleteButton3DProps {
  onClick: () => void;
  tooltip?: string;
  className?: string;
}

export const DeleteButton3D: React.FC<DeleteButton3DProps> = ({
  onClick,
  tooltip = 'Delete',
  className = '',
}) => {
  return (
    <Tooltip tooltip={tooltip}>
      <div
        className={`rounded-sm overflow-hidden transition-all duration-200 bg-gradient-to-b from-[rgb(var(--color-quaternary))] to-[rgb(var(--color-quaternary-dark))] ${className}`}
        style={{
          boxShadow:
            'inset 0 1px 0 0 rgba(255,255,255,0.4), inset 0 -2px 2px rgba(0,0,0,0.2), inset -2px 0 2px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.2)',
          border: '1px solid rgb(var(--color-quaternary))',
        }}
      >
        <button
          onClick={onClick}
          className="p-1 text-white cursor-pointer"
          style={{
            textShadow: '0 -1px 0 rgba(0,0,0,0.2)',
          }}
        >
          <TrashIcon className="h-6 w-6" />
        </button>
      </div>
    </Tooltip>
  );
};

export default DeleteButton3D;
