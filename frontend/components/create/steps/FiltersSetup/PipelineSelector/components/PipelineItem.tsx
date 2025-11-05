import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { TrashIcon, PencilIcon, CopyIcon, DragIcon } from '@/components/icons';
import { ControlRow } from '../../Filters/common/ControlRow';
import { IconButton } from '@/components/shared/IconButton';

interface Pipeline {
  readonly id: string;
  readonly name: string;
  readonly distributionPercentage: number;
}

interface SortablePipelineItemProps {
  pipeline: Pipeline;
  isActive: boolean;
  isEditing: boolean;
  editingName: string;
  canDelete: boolean;
  allowDrag: boolean;
  onSetActive: (pipelineId: string) => void;
  onStartEdit: (pipeline: { id: string; name: string }) => void;
  onRemove: (pipelineId: string) => void;
  onDuplicate: (pipelineId: string, name: string) => void;
  onUpdatePercentage: (pipelineId: string, percentage: number) => void;
  onSetEditingName: (name: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onSaveEdit: () => void;
}

export const SortablePipelineItem: React.FC<SortablePipelineItemProps> = ({
  pipeline,
  isActive,
  isEditing,
  editingName,
  canDelete,
  allowDrag,
  onSetActive,
  onStartEdit,
  onRemove,
  onDuplicate,
  onUpdatePercentage,
  onSetEditingName,
  onKeyPress,
  onSaveEdit,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: pipeline.id,
    disabled: !allowDrag,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
  };

  const containerClasses = `flex items-center rounded-sm overflow-hidden group ${
    isActive
      ? 'bg-gradient-to-b from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-dark))] border-0'
      : 'bg-gray-200 dark:bg-gray-700'
  }`;

  const containerStyle = {
    boxShadow: isActive
      ? 'inset 0 1px 0 0 rgba(255,255,255,0.4), inset 0 -2px 2px rgba(0,0,0,0.2), inset -2px 0 2px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.2)'
      : 'inset 0 1px 0 0 rgba(255,255,255,0.4), inset 1px 0 0 rgba(255,255,255,0.3), inset -3px 0 3px rgba(0,0,0,0.1), inset 0 -3px 3px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.1)',
    border: isActive
      ? '1px solid rgb(var(--color-primary))'
      : '1px solid rgb(var(--color-primary)/0.5)',
  };

  const nameButtonClasses = `p-1.5 text-sm font-medium cursor-pointer ${
    isActive ? 'text-white' : 'text-[rgb(var(--color-primary))]'
  }`;

  const nameButtonStyle = {
    textShadow: isActive ? '0 -1px 0 rgba(0,0,0,0.2)' : 'none',
    maxWidth: '120px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-center space-x-2">
        <div className={containerClasses} style={containerStyle}>
          {allowDrag && (
            <div
              {...attributes}
              {...listeners}
              className={`flex items-center justify-center w-8 h-8 rounded-sm cursor-grab ${
                isActive ? 'border-white/10 bg-transparent' : 'bg-transparent'
              }`}
            >
              <DragIcon
                className={`w-4 h-4 ${
                  isActive ? 'text-white' : 'text-[rgb(var(--color-primary))]'
                }`}
                style={{ marginTop: '1px' }}
              />
            </div>
          )}

          {isEditing ? (
            <div className="flex items-center p-1.5">
              <input
                type="text"
                value={editingName}
                onChange={(e) => onSetEditingName(e.target.value)}
                onKeyDown={onKeyPress}
                onBlur={onSaveEdit}
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
            <button
              className={nameButtonClasses}
              style={nameButtonStyle}
              onClick={() => onSetActive(pipeline.id)}
            >
              {pipeline.name}
            </button>
          )}

          <div className="flex items-center">
            {!isEditing && (
              <IconButton
                icon={<PencilIcon />}
                tooltip="Rename"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartEdit(pipeline);
                }}
                isActive={isActive}
                color="blue"
              />
            )}

            <IconButton
              icon={<CopyIcon />}
              tooltip="Duplicate"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(pipeline.id, `${pipeline.name} (Copy)`);
              }}
              isActive={isActive}
              color="blue"
            />

            {canDelete && (
              <IconButton
                icon={<TrashIcon />}
                tooltip="Delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(pipeline.id);
                }}
                isActive={isActive}
                color="red"
              />
            )}
          </div>
        </div>

        <div className="flex-1" onClick={(e) => e.stopPropagation()}>
          <ControlRow
            key={`distribution-${pipeline.id}`}
            label=""
            value={pipeline.distributionPercentage}
            onChange={(percentage) => onUpdatePercentage(pipeline.id, percentage)}
            min={0}
            max={100}
            step={1}
            color="rgb(var(--color-secondary))"
            showLabel={false}
          />
        </div>
      </div>
    </div>
  );
};
