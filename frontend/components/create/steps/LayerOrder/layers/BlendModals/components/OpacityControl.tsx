import React from 'react';
import SmallNumericStepper from '@/components/shared/SmallNumericStepper';

export const OpacityControl: React.FC<{
  currentOpacity: number;
  onChange: (value: number) => void;
  text: string;
}> = ({ currentOpacity, onChange, text }) => (
  <div className="py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{text}</label>
    <div className="flex items-center space-x-2">
      <SmallNumericStepper
        value={Math.round(currentOpacity * 100)}
        onChange={(value) => onChange(value / 100)}
      />
      <span className="text-sm text-gray-600 dark:text-gray-300">%</span>
    </div>
  </div>
);
