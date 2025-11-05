import React from 'react';

interface MenuButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  shortcut?: string;
  className?: string;
  isLast?: boolean;
  isSelected?: boolean;
}

const MenuButton: React.FC<MenuButtonProps> = ({
  onClick,
  disabled = false,
  children,
  shortcut,
  className = '',
  isLast = false,
  isSelected = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
        isSelected
          ? 'bg-[rgb(var(--color-primary))]/10 dark:bg-[rgb(var(--color-primary))]/20 text-[rgb(var(--color-primary))] dark:text-[rgb(var(--color-primary-light))]'
          : ''
      } text-gray-800 dark:text-gray-400 font-medium ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} w-full ${
        isLast ? 'border-b-0' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between w-full">
        <span className="flex-1 text-left">{children}</span>
        {shortcut && (
          <span className="text-gray-600 dark:text-gray-500 text-xs ml-4 flex-shrink-0">
            {shortcut}
          </span>
        )}
      </div>
    </button>
  );
};

export default MenuButton;
