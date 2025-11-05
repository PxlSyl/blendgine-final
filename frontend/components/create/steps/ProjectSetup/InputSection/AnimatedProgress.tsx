import React, { useEffect, useState, useMemo } from 'react';

interface AnimatedProgressProps {
  progress: number;
  status: string;
  isAnimated?: boolean;
}

const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  progress,
  status,
  isAnimated = false,
}) => {
  const [dots, setDots] = useState('');
  const [stableProgress, setStableProgress] = useState(0);
  const [stableStatus, setStableStatus] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setStableProgress(progress);
    }, 100);

    return () => clearTimeout(timer);
  }, [progress]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStableStatus(status);
    }, 150);

    return () => clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === '') {
          return '.';
        }
        if (prev === '.') {
          return '..';
        }
        if (prev === '..') {
          return '...';
        }
        return '';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const progressDisplay = useMemo(() => {
    return Math.round(stableProgress);
  }, [stableProgress]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 min-w-[280px]">
          {isAnimated
            ? 'Processing your layers for animated collection'
            : 'Processing your collection layers'}
        </span>
        <span className="ml-2 text-xs font-medium text-[rgb(var(--color-secondary))] font-mono min-w-[40px] text-right">
          {progressDisplay}%
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200/70 dark:bg-gray-700/40">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] transition-all duration-300 ease-in-out"
          style={{ width: `${stableProgress}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400 min-h-[16px] font-mono">
        {stableStatus}
        <span className="inline-block min-w-[24px]">{dots}</span>
      </span>
    </div>
  );
};

export default AnimatedProgress;
