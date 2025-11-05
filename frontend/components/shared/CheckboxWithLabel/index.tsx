import React from 'react';

interface CheckboxWithLabelProps {
  label: string | React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

const CheckboxWithLabel: React.FC<CheckboxWithLabelProps> = ({
  label,
  checked,
  onChange,
  className = '',
}) => {
  return (
    <label className={`flex items-center group cursor-pointer ${className}`}>
      <div className="flex items-center px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600">
        <span className="text-sm font-medium mr-3 text-gray-700 dark:text-gray-300 group-hover:text-[rgb(var(--color-secondary))]">
          {label}
        </span>
        <div className="relative">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only peer"
          />
          <div
            className={`
            w-5 h-5 border-2 rounded-md 
            border-gray-300 dark:border-gray-500 
            peer-checked:border-[rgb(var(--color-secondary))] peer-checked:bg-[rgb(var(--color-secondary))]
            ${checked ? 'bg-[rgb(var(--color-secondary))]' : 'bg-transparent'}
          `}
          >
            <svg
              className={`
                w-3 h-3 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                ${checked ? 'opacity-100' : 'opacity-0'}
              `}
              fill="none"
              viewBox="0 0 24 24"
              stroke="white"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </div>
    </label>
  );
};

export default CheckboxWithLabel;
