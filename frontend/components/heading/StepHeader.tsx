import React from 'react';

import SaveLoadButtons from './SaveLoadButtons';

interface StepHeaderProps {
  title: string;
  className?: string;
}

const StepHeader: React.FC<StepHeaderProps> = ({ title, className }) => {
  return (
    <div>
      <div
        className={`px-2 py-2 mx-2 rounded-sm shadow-md text-[rgb(var(--color-primary))] bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 ${className}`}
      >
        <div className="flex justify-between items-center">
          <div className="text-base sm:text-lg font-bold tracking-tight">{title}</div>
          <SaveLoadButtons />
        </div>
      </div>
      <div className="mb-2 px-2">
        <div className="w-full h-1 bg-gradient-to-r from-[rgb(var(--color-primary-light))] to-[rgb(var(--color-secondary))]" />
      </div>
    </div>
  );
};

export default StepHeader;
