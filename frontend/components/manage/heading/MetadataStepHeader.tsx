import React from 'react';

interface MetadataStepHeaderProps {
  title: string;
  className?: string;
}

const MetadataStepHeader: React.FC<MetadataStepHeaderProps> = ({ title, className = '' }) => {
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">
          {title}
        </div>
      </div>
      <div className={`w-full h-1 bg-linear-to-r from-purple-400 to-pink-600 mb-10 ${className}`} />
    </>
  );
};

export default MetadataStepHeader;
