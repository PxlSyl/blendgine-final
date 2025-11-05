import React from 'react';

interface ProgressBarProps {
  sequenceNumber: number;
  totalCount: number;
  label: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ sequenceNumber, totalCount, label }) => {
  const hasData = totalCount > 0;
  const percentage = hasData ? (sequenceNumber / totalCount) * 100 : 0;

  return (
    <div className="w-full max-w-md mt-4">
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary)/0.2)]">
              Progress
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold inline-block text-[rgb(var(--color-primary))]">
              {percentage.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-[rgb(var(--color-primary)/0.2)]">
          <div
            style={{ width: `${percentage}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[rgb(var(--color-secondary))]"
          />
        </div>
      </div>
      <p className="text-2xl font-semibold text-[rgb(var(--color-primary))] text-center h-8">
        {hasData ? `${sequenceNumber} / ${totalCount} ${label}` : ''}
      </p>
    </div>
  );
};
