import React from 'react';

import { ChevronDownIcon } from '@/components/icons';

interface SectionHeaderProps {
  isSelected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  sidebarFull?: boolean;
}

export const SectionHeader = React.memo<SectionHeaderProps>(
  ({ isSelected, onClick, icon, label, disabled, sidebarFull }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`h-10 w-10 lg:w-full rounded-sm font-medium text-left relative mb-1 
        ${
          isSelected
            ? 'bg-[rgb(var(--color-primary))] text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
        } 
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      style={{
        boxShadow: isSelected
          ? 'inset 0 1px 0 0 rgba(255,255,255,0.4), inset 0 -2px 2px rgba(0,0,0,0.2), inset -2px 0 2px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.2)'
          : 'inset 0 1px 0 0 rgba(255,255,255,0.4), inset 1px 0 0 rgba(255,255,255,0.3), inset -3px 0 3px rgba(0,0,0,0.1), inset 0 -3px 3px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.1)',
        border: isSelected
          ? '1px solid rgb(var(--color-primary))'
          : '1px solid rgb(var(--color-primary) / 0.2)',
        textShadow: isSelected ? '0 -1px 0 rgba(0,0,0,0.2)' : 'none',
      }}
    >
      <div className="relative z-10 flex items-center h-full">
        <div
          className={`flex items-center justify-center w-10 h-10 lg:border-r ${
            isSelected ? 'border-r-white/20' : 'border-r-[rgb(var(--color-primary))]/20'
          } ${isSelected ? 'text-white' : 'text-[rgb(var(--color-primary))] dark:text-[rgb(var(--color-primary-light))]'}`}
        >
          {icon}
        </div>
        <div
          className={`hidden ${sidebarFull ? 'lg:flex' : ''} items-center justify-between flex-1 px-2`}
        >
          <span
            className={
              isSelected
                ? 'text-white'
                : 'text-[rgb(var(--color-primary))] dark:text-[rgb(var(--color-primary-light))]'
            }
          >
            {label}
          </span>
          <ChevronDownIcon
            className={`
              w-5 h-5 transition-transform duration-300
              ${isSelected ? 'rotate-0' : '-rotate-90'}
              ${isSelected ? 'text-white' : 'text-[rgb(var(--color-primary))] dark:text-[rgb(var(--color-primary-light))]'}
            `}
          />
        </div>
      </div>
    </button>
  )
);

SectionHeader.displayName = 'SectionHeader';
