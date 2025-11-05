import React from 'react';

interface RegularSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  activeColor?: string;
  className?: string;
  style?: React.CSSProperties;
  percentage?: number;
}

const RegularSlider: React.FC<RegularSliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  activeColor = 'rgb(var(--color-secondary))',
  className = '',
  style = {},
  percentage,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    onChange(newValue);
  };

  const calculatedPercentage = percentage ?? ((value - min) / (max - min)) * 100;

  return (
    <input
      type="range"
      value={value}
      onChange={handleChange}
      min={min}
      max={max}
      step={step}
      className={`w-full h-4 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-0 [&::-webkit-slider-thumb]:h-0 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-0 [&::-moz-range-thumb]:h-0 ${className}`}
      style={{
        backgroundImage: `linear-gradient(to right, ${activeColor} 0%, ${activeColor} ${calculatedPercentage}%, transparent ${calculatedPercentage}%, transparent 100%)`,
        ...style,
      }}
    />
  );
};

export default RegularSlider;
