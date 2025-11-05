import React from 'react';

interface GradientBarProps {
  position?: 'top' | 'bottom';
  className?: string;
  background?: string;
}

const GradientBar: React.FC<GradientBarProps> = ({
  position = 'bottom',
  className = '',
  background,
}) => {
  const roundedClasses =
    position === 'top' ? 'rounded-tr-md rounded-tl-md' : 'rounded-br-md rounded-bl-md';

  const positionClass = position === 'top' ? 'gradient-bar-top' : 'gradient-bar-bottom';

  const backgroundClass = background ?? 'bg-gray-300 dark:bg-gray-900';

  return (
    <div className={`z-[9999] ${backgroundClass} shrink-0 px-2 ${positionClass} ${className}`}>
      <div
        className={`w-full h-[8px] ${roundedClasses} bg-gradient-to-r from-[rgb(var(--color-primary-light))] to-[rgb(var(--color-secondary))]`}
      />
    </div>
  );
};

export default GradientBar;
