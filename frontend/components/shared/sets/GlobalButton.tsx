import React from 'react';

interface GlobalButtonProps {
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

export const GlobalButton: React.FC<GlobalButtonProps> = ({
  isActive,
  onClick,
  className = '',
}) => {
  return (
    <div
      className={`flex items-center rounded-sm overflow-hidden transition-all duration-200 group
      ${
        isActive
          ? 'bg-gradient-to-b from-[rgb(var(--color-accent))] to-[rgb(var(--color-accent-dark))] border-0'
          : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
      } ${className}`}
      style={{
        boxShadow: isActive
          ? 'inset 0 1px 0 0 rgba(255,255,255,0.4), inset 0 -2px 2px rgba(0,0,0,0.2), inset -2px 0 2px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.2)'
          : 'inset 0 1px 0 0 rgba(255,255,255,0.4), inset 1px 0 0 rgba(255,255,255,0.3), inset -3px 0 3px rgba(0,0,0,0.1), inset 0 -3px 3px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.1)',
        border: isActive
          ? '1px solid rgb(var(--color-accent))'
          : '1px solid rgb(var(--color-accent) / 0.5)',
      }}
    >
      <button
        onClick={onClick}
        className={`px-4 py-1 text-sm font-medium cursor-pointer h-8 flex items-center
        ${isActive ? 'text-white' : 'text-[rgb(var(--color-accent))] dark:text-[rgb(var(--color-accent-light))] group-hover:text-[rgb(var(--color-accent-dark))] dark:group-hover:text-[rgb(var(--color-accent))]'}`}
        style={{
          textShadow: isActive ? '0 -1px 0 rgba(0,0,0,0.2)' : 'none',
        }}
      >
        Global
      </button>
    </div>
  );
};
