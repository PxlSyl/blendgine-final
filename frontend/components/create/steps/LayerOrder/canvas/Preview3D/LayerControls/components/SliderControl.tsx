import React from 'react';

interface SliderControlProps {
  value: number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onNumberChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  min: string;
  max: string;
  step: string;
  disabled?: boolean;
  color: string;
  sliderClass: string;
  decimals?: number;
}

export const SliderControl: React.FC<SliderControlProps> = ({
  value,
  onChange,
  onNumberChange,
  min,
  max,
  step,
  disabled,
  color,
  sliderClass,
  decimals = 1,
}) => {
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  const colorClasses = {
    blue: 'text-[rgb(var(--color-accent))] border-[rgb(var(--color-accent)/0.3)] focus:ring-[rgb(var(--color-accent)/0.5)] focus:border-[rgb(var(--color-accent))]',
    purple:
      'text-[rgb(var(--color-primary))] border-[rgb(var(--color-primary)/0.3)] focus:ring-[rgb(var(--color-primary)/0.5)] focus:border-[rgb(var(--color-primary))]',
    pink: 'text-[rgb(var(--color-secondary))] border-[rgb(var(--color-secondary)/0.3)] focus:ring-[rgb(var(--color-secondary)/0.5)] focus:border-[rgb(var(--color-secondary))]',
  }[color];

  const sliderColorClass = {
    blue: 'focus:ring-[rgb(var(--color-accent)/0.5)]',
    purple: 'focus:ring-[rgb(var(--color-primary)/0.5)]',
    pink: 'focus:ring-[rgb(var(--color-secondary)/0.5)]',
  }[color];

  return (
    <div className="relative flex items-center flex-1 min-w-[200px]">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`hidden xs:block ml-2 w-full focus:outline-none focus:ring-2 transition-all ${sliderClass} ${sliderColorClass} ${disabledClass}`}
      />
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value.toFixed(decimals)}
        onChange={onNumberChange}
        disabled={disabled}
        className={`ml-2 w-12 px-1 py-1 text-xs font-medium bg-transparent border rounded-sm focus:outline-none focus:ring-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${colorClasses} ${disabledClass}`}
      />
    </div>
  );
};
