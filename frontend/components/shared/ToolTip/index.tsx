import React, { useState, useCallback, useRef, useEffect, memo } from 'react';

import { CustomTooltip } from './CustomToolTip';
import { useStore } from '@/components/store';

interface TooltipProps {
  children: React.ReactNode;
  tooltip: string;
  delay?: number;
  forceHide?: boolean;
  isDisabled?: boolean;
  className?: string;
}

export const Tooltip = memo(
  ({
    children,
    tooltip,
    delay = 200,
    forceHide = false,
    isDisabled = false,
    className,
  }: TooltipProps) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLSpanElement>(null);

    const globalTooltipsEnabled = useStore((state) => state.showTooltips);

    const tooltipsEnabled = globalTooltipsEnabled && !isDisabled;

    const handleMouseEnter = useCallback(() => {
      if (!tooltipsEnabled) {
        return;
      }

      timeoutRef.current = setTimeout(() => {
        setShowTooltip(true);
      }, delay);
    }, [delay, tooltipsEnabled]);

    const handleMouseLeave = useCallback(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setShowTooltip(false);
    }, []);

    const checkMousePosition = useCallback(
      (e: MouseEvent) => {
        if (containerRef.current && showTooltip) {
          const rect = containerRef.current.getBoundingClientRect();
          const buffer = 30;

          if (
            e.clientX < rect.left - buffer ||
            e.clientX > rect.right + buffer ||
            e.clientY < rect.top - buffer ||
            e.clientY > rect.bottom + buffer
          ) {
            setShowTooltip(false);
          }
        }
      },
      [showTooltip]
    );

    useEffect(() => {
      if (tooltipsEnabled) {
        document.addEventListener('mousemove', checkMousePosition);
      }

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        document.removeEventListener('mousemove', checkMousePosition);
      };
    }, [checkMousePosition, tooltipsEnabled]);

    useEffect(() => {
      if ((forceHide || !tooltipsEnabled) && showTooltip) {
        setShowTooltip(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      }
    }, [forceHide, tooltipsEnabled, showTooltip]);

    if (!tooltipsEnabled) {
      return <>{children}</>;
    }

    return (
      <span
        ref={containerRef}
        className={`relative ${className ?? ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <CustomTooltip
          show={showTooltip && !forceHide}
          text={tooltip}
          containerRef={containerRef}
        />
        {children}
      </span>
    );
  }
);

Tooltip.displayName = 'Tooltip';
