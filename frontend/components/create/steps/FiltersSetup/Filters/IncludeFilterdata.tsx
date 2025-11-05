import React from 'react';
import { useFilters } from '@/components/store/filters/hook';
import Toggle from '@/components/shared/Toggle';

const IncludeFilterData: React.FC = () => {
  const { tintingOptions, toggleIncludeFilterInMetadata } = useFilters();

  return (
    <div className="flex items-center space-x-2">
      <Toggle
        checked={tintingOptions.includeFilterInMetadata}
        onChange={toggleIncludeFilterInMetadata}
        size="sm"
        activeColor="bg-pink-500"
        inactiveColor="bg-gray-300 dark:bg-gray-600"
        thumbColor="bg-white"
      />
      <span className="text-sm text-gray-600 dark:text-gray-300">
        Include filter data in metadata
      </span>
    </div>
  );
};

export default IncludeFilterData;
