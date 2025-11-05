import React, { forwardRef } from 'react';

interface CardProps {
  children: React.ReactNode;
  locked: boolean | undefined;
  onToggleLock: () => void;
  className?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({ children, className = '' }, ref) => (
  <div
    ref={ref}
    className={` bg-white dark:bg-gray-800 rounded-sm shadow-lg relative ${className}`}
  >
    {children}
  </div>
));

Card.displayName = 'Card';
