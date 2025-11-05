import React from 'react';

interface MenuLayoutProps {
  label: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  children: React.ReactNode;
  position?: 'left' | 'right';
  disabled?: boolean;
}

const MenuLayout: React.FC<MenuLayoutProps> = ({
  label,
  isOpen,
  setIsOpen,
  children,
  position = 'left',
  disabled = false,
}) => {
  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onBlur={() => !disabled && setTimeout(() => setIsOpen(false), 200)}
        className={`px-4 py-1.5 text-sm hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none ${
          isOpen ? 'bg-gray-200 dark:bg-gray-700' : ''
        } text-gray-800 dark:text-gray-400 font-medium ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        disabled={disabled}
      >
        {label}
      </button>

      {isOpen && (
        <div
          className={`absolute top-full ${position === 'right' ? 'right-0' : 'left-0'} mt-0.5 bg-gray-300 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-[9999] min-w-[180px]`}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default MenuLayout;
