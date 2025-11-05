import React from 'react';
import MenuButton from './MenuButton';

interface SubMenuProps {
  isOpen: boolean;
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  shortcut?: string;
}

const SubMenu: React.FC<SubMenuProps> = ({
  isOpen,
  children,
  label,
  disabled = false,
  onMouseEnter,
  onMouseLeave,
  shortcut,
}) => {
  return (
    <div className="relative" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <MenuButton onClick={() => {}} disabled={disabled}>
        <div className="flex items-center justify-between w-full">
          <span className="flex-1 text-left">{label}</span>
          <div className="flex items-center ml-4 flex-shrink-0">
            {shortcut && (
              <span className="text-gray-600 dark:text-gray-500 text-xs mr-3">{shortcut}</span>
            )}
            <span className="text-gray-600 dark:text-gray-500 text-xs">▶</span>
          </div>
        </div>
      </MenuButton>
      {isOpen && !disabled && (
        <div className="absolute left-full top-0 mt-0 ml-0.5 bg-gray-300 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-[9999] min-w-[180px]">
          {children}
        </div>
      )}
    </div>
  );
};

export default SubMenu;
