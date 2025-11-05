import React, { ReactNode } from 'react';

interface AddButtonProps {
  onClick: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  color?: 'purple' | 'blue' | 'pink' | 'red' | 'green';
}

export const AddButton: React.FC<AddButtonProps> = ({
  onClick,
  disabled = false,
  icon,
  children,
  color = 'purple',
}) => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'purple':
        return 'from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-dark))]';
      case 'blue':
        return 'from-[rgb(var(--color-accent))] to-[rgb(var(--color-accent-dark))]';
      case 'pink':
        return 'from-[rgb(var(--color-secondary))] to-[rgb(var(--color-secondary-dark))]';
      case 'red':
        return 'from-[rgb(var(--color-quaternary))] to-[rgb(var(--color-quaternary-dark))]';
      case 'green':
        return 'from-[rgb(var(--color-quinary))] to-[rgb(var(--color-quinary-dark))]';
      default:
        return 'from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-dark))]';
    }
  };

  const getHoverClasses = (color: string) => {
    switch (color) {
      case 'purple':
        return 'hover:from-[rgb(var(--color-primary-dark))] hover:to-[rgb(var(--color-primary))]';
      case 'blue':
        return 'hover:from-[rgb(var(--color-accent-dark))] hover:to-[rgb(var(--color-accent))]';
      case 'pink':
        return 'hover:from-[rgb(var(--color-secondary-dark))] hover:to-[rgb(var(--color-secondary))]';
      case 'red':
        return 'hover:from-[rgb(var(--color-quaternary-dark))] hover:to-[rgb(var(--color-quaternary))]';
      case 'green':
        return 'hover:from-[rgb(var(--color-quinary-dark))] hover:to-[rgb(var(--color-quinary))]';
      default:
        return 'hover:from-[rgb(var(--color-primary-dark))] hover:to-[rgb(var(--color-primary))]';
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center w-full sm:w-auto px-0 text-white rounded-sm transition-all duration-300 text-sm ${
        disabled
          ? 'bg-gray-400 cursor-not-allowed'
          : `bg-gradient-to-b ${getColorClasses(color)} ${getHoverClasses(color)} transform cursor-pointer`
      }`}
      style={{
        boxShadow: disabled
          ? 'none'
          : 'inset 0 1px 0 0 rgba(255,255,255,0.4), inset 0 -2px 2px rgba(0,0,0,0.2), inset -2px 0 2px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.2)',
        border: disabled ? '1px solid #9ca3af' : '1px solid rgba(0,0,0,0.2)',
        textShadow: '0 -1px 0 rgba(0,0,0,0.2)',
      }}
    >
      {icon && (
        <div className="flex items-center justify-center px-3 py-2 border-r border-r-white/20">
          {icon}
        </div>
      )}
      <div className="px-3 py-2">{children}</div>
    </button>
  );
};

export default AddButton;
