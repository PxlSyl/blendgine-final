import React, { ReactNode } from 'react';
import { Tooltip } from '@/components/shared/ToolTip';

interface Header3DControlsButtonProps {
  onClick: () => void;
  disabled?: boolean;
  icon: ReactNode;
  children?: ReactNode;
  tooltipText: string;
  color: 'purple' | 'pink';
}

const Header3DControlsButton: React.FC<Header3DControlsButtonProps> = ({
  onClick,
  disabled,
  icon,
  children,
  tooltipText,
  color,
}) => {
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  const bgColorClass =
    color === 'purple'
      ? 'bg-gradient-to-b from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-dark))]'
      : 'bg-gradient-to-b from-[rgb(var(--color-secondary))] to-[rgb(var(--color-secondary-dark))]';

  const getBorderColor = () => {
    return color === 'purple'
      ? '1px solid rgb(var(--color-primary))'
      : '1px solid rgb(var(--color-secondary))';
  };

  return (
    <div
      className={`flex items-center rounded-sm overflow-hidden group ${bgColorClass} min-w-fit`}
      style={{
        boxShadow:
          'inset 0 1px 0 0 rgba(255,255,255,0.4), inset 0 -2px 2px rgba(0,0,0,0.2), inset -2px 0 2px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.2)',
        border: getBorderColor(),
      }}
    >
      <button
        onClick={onClick}
        disabled={disabled}
        className={`text-sm font-medium flex items-center ${disabledClass}`}
        style={{
          textShadow: '0 -1px 0 rgba(0,0,0,0.2)',
        }}
      >
        <Tooltip tooltip={tooltipText}>
          <div className="flex items-center text-white">
            {icon && (
              <div className="flex items-center justify-center px-1.5 py-1 border-r border-r-white/20">
                {icon}
              </div>
            )}
            <div className="hidden sm:block px-1.5 py-1">
              <span>{children}</span>
            </div>
          </div>
        </Tooltip>
      </button>
    </div>
  );
};

export default Header3DControlsButton;
