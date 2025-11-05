import React, { memo, useState } from 'react';
import { capitalize } from '@/utils/functionsUtils';
import { PencilIcon } from '@/components/icons';
import { Tooltip } from '@/components/shared/ToolTip';

interface EditableNameProps {
  isEditing: boolean;
  value: string;
  onSubmit: (newValue?: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onEditStart: () => void;
}

export const EditableName: React.FC<EditableNameProps> = memo(
  ({ isEditing, value, onSubmit, onKeyDown, onEditStart }) => {
    const [editValue, setEditValue] = useState(value);

    React.useEffect(() => {
      setEditValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditValue(e.target.value);
    };

    const handleSubmit = () => {
      onSubmit(editValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        setEditValue(value);
        onEditStart();
      } else {
        onKeyDown(e);
      }
    };

    return isEditing ? (
      <input
        type="text"
        value={editValue}
        onChange={handleChange}
        onBlur={handleSubmit}
        onKeyDown={handleKeyDown}
        className="bg-transparent border-b border-[rgb(var(--color-secondary))] focus:outline-none text-sm text-gray-700 dark:text-gray-300"
        autoFocus
      />
    ) : (
      <div className="flex items-center">
        <span className="text-sm text-gray-700 dark:text-gray-300">{capitalize(value)}</span>
        <Tooltip tooltip="Rename folder">
          <div
            onClick={(e) => {
              e.stopPropagation();
              onEditStart();
            }}
            className="ml-2 text-gray-500 cursor-pointer"
          >
            <PencilIcon className="w-4 h-4" />
          </div>
        </Tooltip>
      </div>
    );
  }
);

EditableName.displayName = 'EditableName';
