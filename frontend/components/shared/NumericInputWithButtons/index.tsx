import React, { ReactNode } from 'react';

import { MinusCircleIcon, PlusCircleIcon } from '@/components/icons';

export const NumericInputWithButtons: React.FC<{
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}> = ({ label, value, onChange, min = 0, max, step = 1, placeholder }) => {
  const displayValue = isNaN(parseInt(value)) ? min.toString() : value;

  const handleIncrement = () => {
    const currentValue = parseInt(displayValue) || min;
    const newValue = max !== undefined ? Math.min(currentValue + step, max) : currentValue + step;
    onChange(newValue.toString());
  };

  const handleDecrement = () => {
    const currentValue = parseInt(displayValue) || min;
    const newValue = Math.max(currentValue - step, min);
    onChange(newValue.toString());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        handleIncrement();
        break;
      case 'ArrowDown':
        e.preventDefault();
        handleDecrement();
        break;
    }
  };

  const inputWrapperClasses = 'relative group';
  const gradientBgClass =
    'absolute inset-0 bg-gradient-to-r from-[rgb(var(--color-primary-light))]/75 to-[rgb(var(--color-secondary))]/75 rounded-sm blur-sm';
  const labelClasses = `z-10 pr-2 absolute text-xs font-bold 
      text-gray-700 dark:text-gray-300
      left-0 -top-2.5 px-1 rounded-sm
      bg-white/75 dark:bg-gray-800/75`;

  return (
    <div className="relative">
      <label className={labelClasses}>{label}</label>
      <div className={inputWrapperClasses}>
        <div className={gradientBgClass} />
        <div className="relative flex">
          <button
            onClick={handleDecrement}
            className="flex items-center justify-center px-3 py-2 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <MinusCircleIcon className="w-5 h-5 text-[rgb(var(--color-primary))]" />
          </button>
          <input
            type="text"
            value={displayValue}
            onChange={(e) => {
              const newValue = e.target.value;
              if (newValue === '' || /^\d+$/.test(newValue)) {
                onChange(newValue || min.toString());
              }
            }}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              const numValue = parseInt(displayValue);
              if (isNaN(numValue)) {
                onChange(min.toString());
              } else {
                const boundedValue = Math.max(min, Math.min(numValue, max ?? numValue));
                onChange(boundedValue.toString());
              }
            }}
            className="min-w-16 w-full px-4 py-2 relative text-center
              bg-white dark:bg-gray-900 text-gray-900 dark:text-white
              placeholder-gray-400 focus:outline-none"
            placeholder={placeholder}
          />
          <button
            onClick={handleIncrement}
            className="flex items-center justify-center px-3 py-2 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <PlusCircleIcon className="w-5 h-5 text-[rgb(var(--color-primary))]" />
          </button>
        </div>
      </div>
    </div>
  );
};
