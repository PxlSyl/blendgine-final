import React from 'react';
import './ThinSlider.css';

interface ThinSliderProps {
  value: number;
  min?: number;
  max: number;
  step?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
  color?: string;
  className?: string;
}

export const ThinSlider: React.FC<ThinSliderProps> = ({
  value,
  min = 0,
  max,
  step = 0.01,
  disabled = false,
  onChange,
  color,
  className = '',
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="relative">
      <input
        type="range"
        data-thin-slider
        data-color-start={color}
        data-color-end={color}
        data-value={`${percentage}%`}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          const newValue = parseFloat(e.target.value);
          const boundedValue = Math.max(min, Math.min(max, newValue));
          onChange(boundedValue);
        }}
        className={`w-full ${className}`}
        style={
          {
            cursor: 'pointer',
            '--color-start': color,
            '--color-end': color,
            '--value': `${percentage}%`,
          } as React.CSSProperties
        }
        disabled={disabled}
      />
    </div>
  );
};
