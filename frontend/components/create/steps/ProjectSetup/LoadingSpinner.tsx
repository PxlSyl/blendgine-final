import React, { useEffect, useState, useMemo } from 'react';

export const LoadingSpinner: React.FC<{ progress: number; status: string }> = ({
  progress,
  status,
}) => {
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

  const progressDisplay = useMemo(() => {
    return Math.round(stableProgress);
  }, [stableProgress]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/5 backdrop-blur-sm z-10">
      <div className="relative">
        <div className="animate-spin rounded-full h-36 w-36 border-b-4 border-[rgb(var(--color-primary))]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-semibold text-[rgb(var(--color-primary))] font-mono min-w-[60px] text-center">
            {progressDisplay}%
          </span>
        </div>
      </div>
      <div className="mt-4 text-sm text-gray-600 max-w-xs text-center font-mono min-h-[20px]">
        {stableStatus}
      </div>
    </div>
  );
};
