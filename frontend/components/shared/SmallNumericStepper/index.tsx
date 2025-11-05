import React from 'react';

import { MinusCircleIcon, PlusCircleIcon } from '@/components/icons';

interface SmallNumericStepperProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  variant?: 'default' | 'purple';
}

const SmallNumericStepper: React.FC<SmallNumericStepperProps> = ({
  value,
  onChange,
  disabled = false,
  min = 0,
  max,
  step = 1,
  variant = 'default',
}) => {
  const handleDecrease = () => {
    if (value > min) {
      const newValue = Math.max(min, value - step);
      onChange(newValue);
    }
  };

  const handleIncrease = () => {
    if (max === undefined || value < max) {
      const newValue = max !== undefined ? Math.min(max, value + step) : value + step;
      onChange(newValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      if (min !== undefined && max !== undefined) {
        const boundedValue = Math.max(min, Math.min(max, newValue));
        onChange(boundedValue);
      } else {
        onChange(newValue);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) {
      return;
    }

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        handleIncrease();
        break;
      case 'ArrowDown':
        e.preventDefault();
        handleDecrease();
        break;
    }
  };

  const getIconColor = () => {
    if (disabled) {
      return 'text-gray-400';
    }
    return variant === 'purple'
      ? 'text-gray-400 hover:text-[rgb(var(--color-primary))]'
      : 'text-gray-400 hover:text-[rgb(var(--color-accent))]';
  };

  const getInputColor = () => {
    if (disabled) {
      return 'text-gray-700 dark:text-gray-300';
    }
    return variant === 'purple'
      ? 'text-[rgb(var(--color-secondary))]'
      : 'text-gray-700 dark:text-gray-300';
  };

  return (
    <div className="flex items-center">
      <button
        onClick={handleDecrease}
        disabled={disabled || value === min}
        className={`
          p-0.5 text-xs
          cursor-pointer
          ${getIconColor()}
          ${(disabled || value === min) && 'opacity-50 cursor-not-allowed'}
        `}
      >
        <MinusCircleIcon className="mr-1 w-4 h-4" />
      </button>
      <input
        type="number"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className={`
          w-10 px-1 py-0.5 text-xs text-center
          bg-gray-100 dark:bg-gray-700
          ${getInputColor()}
          border border-gray-300 dark:border-gray-600
          rounded-sm
          focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-accent))]
          [appearance:textfield]
          [&::-webkit-outer-spin-button]:appearance-none
          [&::-webkit-inner-spin-button]:appearance-none
          [-moz-appearance:textfield]
          ${disabled && 'opacity-50 cursor-not-allowed'}
        `}
      />
      <button
        onClick={handleIncrease}
        disabled={disabled || (max !== undefined && value >= max)}
        className={`
          p-0.5 text-xs
          cursor-pointer
          ${getIconColor()}
          ${(disabled || (max !== undefined && value >= max)) && 'opacity-50 cursor-not-allowed'}
        `}
      >
        <PlusCircleIcon className="ml-1 w-4 h-4" />
      </button>
    </div>
  );
};

export default SmallNumericStepper;
