import React from 'react';
import { MinusCircleIcon, PlusCircleIcon } from '@/components/icons';
import { Tooltip } from '@/components/shared/ToolTip';
import { ControlButton } from './ControlButton';

interface ControlGroupProps {
  icon: React.ReactNode;
  color: string;
  tooltip: string;
  onDecrease: () => void;
  onIncrease: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export const ControlGroup: React.FC<ControlGroupProps> = ({
  icon,
  color,
  tooltip,
  onDecrease,
  onIncrease,
  disabled,
  children,
}) => {
  const borderColorClass = {
    blue: 'border-[rgb(var(--color-accent))] text-[rgb(var(--color-accent))]',
    purple: 'border-[rgb(var(--color-primary))] text-[rgb(var(--color-primary))]',
    pink: 'border-[rgb(var(--color-secondary))] text-[rgb(var(--color-secondary))]',
  }[color];

  return (
    <div className="flex items-center">
      <div className="flex items-center h-8 shrink-0">
        <ControlButton
          onClick={onDecrease}
          disabled={disabled}
          tooltip={`Decrease ${tooltip.toLowerCase()}`}
          icon={<MinusCircleIcon />}
          color={color}
        />
        <span
          className={`px-2 text-sm rounded-sm border h-6 flex items-center mx-1 ${borderColorClass}`}
        >
          <Tooltip tooltip={`${tooltip} control`}>{icon}</Tooltip>
        </span>
        <ControlButton
          onClick={onIncrease}
          disabled={disabled}
          tooltip={`Increase ${tooltip.toLowerCase()}`}
          icon={<PlusCircleIcon />}
          color={color}
        />
      </div>
      {children}
    </div>
  );
};
