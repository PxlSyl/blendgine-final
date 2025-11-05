import React from 'react';
import { useFilters } from '@/components/store/filters/hook';
import Toggle from '@/components/shared/Toggle';

const FlipFlopMetadataToggle: React.FC = () => {
  const { flipOptions, toggleIncludeFlipFlopInMetadata: toggleIncludeInMetadata } = useFilters();

  return (
    <div className="flex items-center space-x-3 mb-2 ml-2">
      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
        Include in metadata?
      </label>
      <Toggle
        checked={flipOptions?.includeInMetadata ?? false}
        onChange={toggleIncludeInMetadata}
        size="sm"
        activeColor="bg-[rgb(var(--color-secondary))]"
        inactiveColor="bg-gray-300 dark:bg-gray-600"
        thumbColor="bg-white"
      />
    </div>
  );
};

export default FlipFlopMetadataToggle;
