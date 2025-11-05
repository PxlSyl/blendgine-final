import React from 'react';
import { PlusCircleIcon } from '@/components/icons';
import AddButton from '@/components/windows/rules/components/common/AddButton';

interface ActionButtonProps {
  onClick: () => void;
  disabled: boolean;
  isSubmitting: boolean;
  buttonText: string;
  buttonColor?: 'purple' | 'blue' | 'pink' | 'red' | 'green';
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  disabled,
  isSubmitting,
  buttonText,
  buttonColor = 'blue',
}) => {
  return (
    <div className="flex justify-end">
      <AddButton
        onClick={onClick}
        disabled={disabled}
        icon={<PlusCircleIcon className="w-5 h-5" />}
        color={buttonColor}
      >
        {isSubmitting ? 'Adding...' : buttonText}
      </AddButton>
    </div>
  );
};
