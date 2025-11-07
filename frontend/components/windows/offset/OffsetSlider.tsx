import React, { useMemo } from 'react';

import SmallNumericStepper from '@/components/shared/SmallNumericStepper';

interface OffsetSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

const sliderClassName = `flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]/30 transition-colors
  [&::-webkit-slider-thumb]:appearance-none
  [&::-webkit-slider-thumb]:w-4
  [&::-webkit-slider-thumb]:h-4
  [&::-webkit-slider-thumb]:rounded-full
  [&::-webkit-slider-thumb]:bg-[rgb(var(--color-primary))]
  [&::-webkit-slider-thumb]:border-2
  [&::-webkit-slider-thumb]:border-white
  [&::-webkit-slider-thumb]:transition-colors
  [&::-webkit-slider-thumb]:cursor-pointer
  [&::-webkit-slider-thumb]:shadow-sm
  [&::-webkit-slider-thumb]:hover:bg-[rgb(var(--color-primary-dark))]
  dark:[&::-webkit-slider-thumb]:bg-[rgb(var(--color-primary-light))]
  dark:[&::-webkit-slider-thumb]:border-gray-900
  dark:[&::-webkit-slider-thumb]:hover:bg-[rgb(var(--color-secondary-light))]
  [&::-moz-range-thumb]:appearance-none
  [&::-moz-range-thumb]:w-4
  [&::-moz-range-thumb]:h-4
  [&::-moz-range-thumb]:rounded-full
  [&::-moz-range-thumb]:bg-[rgb(var(--color-primary))]
  [&::-moz-range-thumb]:border-2
  [&::-moz-range-thumb]:border-white
  [&::-moz-range-thumb]:transition-colors
  [&::-moz-range-thumb]:cursor-pointer
  [&::-moz-range-thumb]:shadow-sm
  [&::-moz-range-thumb]:hover:bg-[rgb(var(--color-primary-dark))]
  dark:[&::-moz-range-thumb]:bg-[rgb(var(--color-primary-light))]
  dark:[&::-moz-range-thumb]:border-gray-900
  dark:[&::-moz-range-thumb]:hover:bg-[rgb(var(--color-secondary-light))]
  [&::-moz-range-thumb]:border-solid`;

const getSliderBackground = (value: number, min: number, max: number) => {
  if (max === min) {
    return 'linear-gradient(to right, rgb(var(--color-primary)) 0%, rgb(var(--color-primary)) 100%)';
  }

  const percentage = ((value - min) / (max - min)) * 100;
  return `linear-gradient(to right, rgb(var(--color-primary)) 0%, rgb(var(--color-primary)) ${percentage}%, rgb(156 163 175) ${percentage}%, rgb(156 163 175) 100%)`;
};

export const OffsetSlider: React.FC<OffsetSliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}) => {
  const boundedValue = useMemo(() => Math.min(Math.max(value, min), max), [value, min, max]);

  const sliderBackground = useMemo(
    () => ({ background: getSliderBackground(boundedValue, min, max) }),
    [boundedValue, min, max]
  );

  const handleRangeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(event.target.value, 10);

    if (!Number.isNaN(newValue)) {
      onChange(newValue);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <span className="text-sm font-semibold text-[rgb(var(--color-primary))] dark:text-[rgb(var(--color-primary-light))]">
          {boundedValue}px
        </span>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={boundedValue}
          onChange={handleRangeChange}
          className={sliderClassName}
          style={sliderBackground}
        />
        <SmallNumericStepper
          value={boundedValue}
          onChange={onChange}
          min={min}
          max={max}
          step={step}
        />
      </div>
    </div>
  );
};

export const offsetSliderClassName = sliderClassName;
