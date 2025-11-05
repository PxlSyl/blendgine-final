/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';

import { MinusCircleIcon, PlusCircleIcon } from '@/components/icons';

interface NumericStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  disabled?: boolean;
  containerClassName?: string;
  inputClassName?: string;
  buttonClassName?: string;
  labelClassName?: string;
  textColorClass?: string;
  bgColorClass?: string;
  borderColorClass?: string;
  hoverBgColorClass?: string;
  focusRingColorClass?: string;
}

const NumericStepper: React.FC<NumericStepperProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  disabled = false,
  containerClassName = '',
  inputClassName = '',
  buttonClassName = '',
  labelClassName = '',
  textColorClass = 'dark:text-white text-gray-800',
  bgColorClass = 'dark:bg-gray-700 bg-white',
  borderColorClass = 'dark:border-gray-600 border-gray-300',
  hoverBgColorClass = 'dark:hover:bg-gray-600 hover:bg-gray-100',
  focusRingColorClass = 'focus:ring-[rgb(var(--color-primary))]/40 focus:border-[rgb(var(--color-primary))]/40',
}) => {
  const handleDecrease = () => {
    if (min !== undefined) {
      onChange(Math.max(min, value - step));
    } else {
      onChange(value - step);
    }
  };

  const handleIncrease = () => {
    if (max !== undefined) {
      onChange(Math.min(max, value + step));
    } else {
      onChange(value + step);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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

  return (
    <div className={`flex items-center gap-2 w-full ${containerClassName}`}>
      <button
        onClick={handleDecrease}
        disabled={disabled}
        className={`shrink-0 flex items-center justify-center w-6 h-6 rounded-full 
          bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} 
          ${buttonClassName}`}
      >
        <MinusCircleIcon className="w-4 h-4 text-[rgb(var(--color-primary))]" />
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const newValue = parseInt(e.target.value);
          if (!isNaN(newValue) && newValue >= (min ?? 0) && newValue <= (max ?? 100)) {
            onChange(newValue);
          }
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className={`w-full h-[22px] px-2 text-center text-[rgb(var(--color-secondary))] dark:text-[rgb(var(--color-secondary))] bg-gray-300 dark:bg-gray-700 border-none outline-none focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-accent))]/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${inputClassName}`}
        style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
      />
      <button
        onClick={handleIncrease}
        disabled={disabled}
        className={`shrink-0 flex items-center justify-center w-6 h-6 rounded-full 
          bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} 
          ${buttonClassName}`}
      >
        <PlusCircleIcon className="w-4 h-4 text-[rgb(var(--color-primary))]" />
      </button>
      {label && (
        <span className={`shrink-0 text-sm text-gray-600 dark:text-gray-300 ${labelClassName}`}>
          {label}
        </span>
      )}
    </div>
  );
};

export default NumericStepper;
