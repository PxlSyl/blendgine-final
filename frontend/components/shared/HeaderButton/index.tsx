import React, { ReactNode } from 'react';

interface HeaderButtonProps {
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
  isActive: boolean;
  variant?: 'default' | 'pink';
  disabled?: boolean;
}

const HeaderButton: React.FC<HeaderButtonProps> = ({
  onClick,
  icon,
  children,
  isActive,
  variant = 'default',
  disabled = false,
}) => {
  const getBackgroundClasses = () => {
    if (variant === 'pink') {
      return isActive
        ? 'bg-gradient-to-b from-[rgb(var(--color-secondary))] to-[rgb(var(--color-secondary-dark))] border-0'
        : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600';
    }
    return isActive
      ? 'bg-gradient-to-b from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-dark))] border-0'
      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600';
  };

  const getBorderColor = () => {
    if (variant === 'pink') {
      return isActive
        ? '1px solid rgb(var(--color-secondary))'
        : '1px solid rgb(var(--color-primary) / 0.5)';
    }
    return isActive
      ? '1px solid rgb(var(--color-primary))'
      : '1px solid rgb(var(--color-primary) / 0.5)';
  };

  const textColorClasses = isActive
    ? 'text-white'
    : 'text-[rgb(var(--color-primary))] dark:text-[rgb(var(--color-primary-light))] group-hover:text-[rgb(var(--color-primary-dark))] dark:group-hover:text-[rgb(var(--color-primary))]';

  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  return (
    <div
      className={`flex items-center rounded-sm overflow-hidden group
      ${getBackgroundClasses()}`}
      style={{
        boxShadow: isActive
          ? 'inset 0 1px 0 0 rgba(255,255,255,0.4), inset 0 -2px 2px rgba(0,0,0,0.2), inset -2px 0 2px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.2)'
          : 'inset 0 1px 0 0 rgba(255,255,255,0.4), inset 1px 0 0 rgba(255,255,255,0.3), inset -3px 0 3px rgba(0,0,0,0.1), inset 0 -3px 3px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.1)',
        border: getBorderColor(),
      }}
    >
      <button
        onClick={onClick}
        disabled={disabled}
        className={`text-sm font-medium flex items-center ${disabledClass}`}
        style={{
          textShadow: disabled || !isActive ? 'none' : '0 -1px 0 rgba(0,0,0,0.2)',
        }}
      >
        {icon && (
          <div
            className={`flex items-center justify-center px-2 py-1.5 border-r ${isActive ? 'border-r-white/20' : 'border-r-[rgb(var(--color-primary))]/20'} ${textColorClasses}`}
          >
            {icon}
          </div>
        )}
        <div className="hidden sm:block px-2 py-1.5">
          <span className={textColorClasses}>{children}</span>
        </div>
      </button>
    </div>
  );
};

export default HeaderButton;
