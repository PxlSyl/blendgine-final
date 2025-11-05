import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SetButton, SetButtonProps } from './SetButton';

export interface SetSelectorProps {
  availableSets?: number[];
  activeSet?: string;
  onSetClick?: (setNumber: number) => void;

  showGlobalButton?: boolean;
  isGlobalActive?: boolean;
  onGlobalClick?: () => void;

  allowRename?: boolean;
  allowDelete?: boolean;
  allowDuplicate?: boolean;
  onRename?: (setNumber: number, newName: string) => void;
  onDelete?: (setNumber: number) => void;
  onDuplicate?: (setNumber: number) => void;

  showAddButton?: boolean;
  onAdd?: () => void;

  customNames?: Record<string, string>;
  className?: string;
  containerClassName?: string;

  activeGradient?: string;
  activeBorderColor?: string;
  inactiveBorderColor?: string;

  useHook?: boolean;
  includeGlobalView?: boolean;

  allowDrag?: boolean;
  tooltipsDisabled?: boolean;
}

interface SortableSetButtonProps extends Omit<SetButtonProps, 'dragHandleProps'> {
  setNumber: number;
  allowDrag?: boolean;
}

export const SortableSetButton: React.FC<SortableSetButtonProps> = ({
  setNumber,
  allowDrag = true,
  ...props
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `set${setNumber}`,
    disabled: !allowDrag,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <SetButton
        setNumber={setNumber}
        dragHandleProps={
          allowDrag
            ? {
                ...attributes,
                ...listeners,
              }
            : undefined
        }
        showDragHandle={allowDrag}
        {...props}
      />
    </div>
  );
};
