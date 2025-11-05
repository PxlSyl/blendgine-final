import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  size?: 'sm' | 'md' | 'lg';
  activeColor?: string;
  inactiveColor?: string;
  thumbColor: string;
  disabled?: boolean;
}

const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  size = 'md',
  activeColor = 'bg-[rgb(var(--color-primary))]',
  inactiveColor = 'bg-gray-300',
  thumbColor,
  disabled = false,
}) => {
  const sizes = {
    sm: 'w-9 h-5',
    md: 'w-11 h-6',
    lg: 'w-14 h-7',
  };

  const dotSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const translations = {
    sm: 'translate-x-4',
    md: 'translate-x-5',
    lg: 'translate-x-7',
  };

  return (
    <div
      className={`${sizes[size]} flex items-center rounded-full p-1 ${
        checked ? activeColor : inactiveColor
      } ${disabled ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={() => !disabled && onChange()}
    >
      <div
        className={`${dotSizes[size]} ${thumbColor} rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
          checked ? `bg-white ${translations[size]}` : ''
        }`}
      />
    </div>
  );
};

export default Toggle;
