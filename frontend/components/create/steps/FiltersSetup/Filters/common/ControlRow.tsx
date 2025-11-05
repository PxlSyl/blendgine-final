import React from 'react';
import { ThinSlider } from '@/components/shared/ThinSlider';
import SmallNumericStepper from '@/components/shared/SmallNumericStepper';

interface ControlRowProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  color: string;
  showLabel?: boolean;
}

export const ControlRow: React.FC<ControlRowProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step,
  color,
  showLabel = true,
}) => (
  <div className="flex items-center space-x-4 mb-2">
    {showLabel && (
      <span className="text-xs font-bold text-[rgb(var(--color-secondary))] w-24">{label}:</span>
    )}
    <div className="grow">
      <ThinSlider value={value} onChange={onChange} min={min} max={max} step={step} color={color} />
    </div>
    <div className="flex items-center space-x-1">
      <SmallNumericStepper value={value} onChange={onChange} min={min} max={max} step={step} />
    </div>
  </div>
);
