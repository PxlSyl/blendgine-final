import React, { useState, useEffect } from 'react';

import { TrashIcon, PencilIcon, DragIcon, CopyIcon } from '@/components/icons';
import { Tooltip } from '@/components/shared/ToolTip';
import { IconButton } from '@/components/shared/IconButton';

export interface SetButtonProps {
  setNumber: number;
  isActive: boolean;
  onClick: (setNumber: number) => void;
  customName?: string;
  allowRename?: boolean;
  onRename?: (setNumber: number, newName: string) => void;
  allowDelete?: boolean;
  onDelete?: (setNumber: number) => void;
  allowDuplicate?: boolean;
  onDuplicate?: (setNumber: number) => void;
  activeGradient?: string;
  activeBorderColor?: string;
  inactiveBorderColor?: string;
  totalSetsCount?: number;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  showDragHandle?: boolean;
  tooltipsDisabled?: boolean;
}

export const SetButton: React.FC<SetButtonProps> = ({
  setNumber,
  isActive,
  onClick,
  customName,
  allowRename = false,
  onRename,
  allowDelete = false,
  onDelete,
  allowDuplicate = false,
  onDuplicate,
  activeGradient = 'from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-dark))]',
  activeBorderColor = 'rgb(var(--color-primary))',
  inactiveBorderColor = 'rgb(var(--color-primary) / 0.5)',
  totalSetsCount = 1,
  dragHandleProps,
  showDragHandle = true,
  tooltipsDisabled = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(customName ?? '');

  useEffect(() => {
    if (!isEditing) {
      setEditName(customName ?? '');
    }
  }, [customName, isEditing]);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditName(e.target.value);
  };

  const handleNameSubmit = () => {
    if (onRename && editName.trim()) {
      onRename(setNumber, editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditName(customName ?? '');
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(setNumber);
    }
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDuplicate) {
      onDuplicate(setNumber);
    }
  };

  const showDeleteButton = allowDelete && onDelete && totalSetsCount > 1;

  return (
    <div
      className={`flex items-center rounded-sm overflow-hidden group
      ${
        isActive
          ? `bg-gradient-to-b ${activeGradient} border-0`
          : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
      }`}
      style={{
        boxShadow: isActive
          ? 'inset 0 1px 0 0 rgba(255,255,255,0.4), inset 0 -2px 2px rgba(0,0,0,0.2), inset -2px 0 2px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.2)'
          : 'inset 0 1px 0 0 rgba(255,255,255,0.4), inset 1px 0 0 rgba(255,255,255,0.3), inset -3px 0 3px rgba(0,0,0,0.1), inset 0 -3px 3px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.1)',
        border: isActive ? `1px solid ${activeBorderColor}` : `1px solid ${inactiveBorderColor}`,
      }}
    >
      {showDragHandle && dragHandleProps && (
        <div
          {...dragHandleProps}
          className={`flex items-center justify-center w-8 h-8 rounded-sm cursor-grab
          ${isActive ? 'border-white/10 bg-transparent' : 'bg-transparent'}`}
        >
          <DragIcon
            className={`w-4 h-4
            ${isActive ? 'text-white' : 'text-[rgb(var(--color-primary))] dark:text-[rgb(var(--color-primary-light))]'}`}
            style={{ marginTop: '1px' }}
          />
        </div>
      )}

      {isEditing ? (
        <div className="flex items-center px-2 py-1">
          <input
            type="text"
            value={editName}
            onChange={handleNameChange}
            onBlur={handleNameSubmit}
            onKeyDown={handleKeyDown}
            className="bg-transparent border-b border-white focus:outline-none text-sm w-full min-w-[50px]"
            style={{
              color: isActive ? 'white' : 'inherit',
              maxWidth: '120px',
            }}
            autoFocus
            onClick={(e) => e.stopPropagation()}
            maxLength={16}
          />
        </div>
      ) : (
        <Tooltip tooltip="Select" forceHide={isActive} isDisabled={tooltipsDisabled}>
          <button
            onClick={() => onClick(setNumber)}
            className={`px-2 py-1 text-sm font-medium cursor-pointer
            ${isActive ? 'text-white' : 'text-[rgb(var(--color-primary))] dark:text-[rgb(var(--color-primary-light))] group-hover:text-[rgb(var(--color-primary-dark))] dark:group-hover:text-[rgb(var(--color-primary))]'}`}
            style={{
              textShadow: isActive ? '0 -1px 0 rgba(0,0,0,0.2)' : 'none',
              maxWidth: '120px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {customName ?? `Set ${setNumber}`}
          </button>
        </Tooltip>
      )}

      <div className="flex items-center">
        {allowRename && onRename && (
          <IconButton
            icon={<PencilIcon />}
            tooltip={`Rename ${customName ?? `Set ${setNumber}`}`}
            onClick={handleEditClick}
            isActive={isActive}
            color="blue"
          />
        )}

        {allowDuplicate && onDuplicate && (
          <IconButton
            icon={<CopyIcon />}
            tooltip={`Duplicate ${customName ?? `Set ${setNumber}`}`}
            onClick={handleDuplicate}
            isActive={isActive}
            color="blue"
          />
        )}

        {showDeleteButton && (
          <IconButton
            icon={<TrashIcon />}
            tooltip={`Delete ${customName ?? `Set ${setNumber}`}`}
            onClick={handleDelete}
            isActive={isActive}
            color="red"
          />
        )}
      </div>
    </div>
  );
};
