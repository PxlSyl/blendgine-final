import React, { useState, useMemo } from 'react';

import type { FilterName } from '@/types/effect';
import { getFilterDisplayName } from '@/components/store/filters/main/utils/filterUtils';
import { EffectsIcon } from '@/components/icons/StepIcons';
import SearchBar from '@/components/shared/SearchBar';
import { filterTypes } from './filterTypes';
import { BaseModal } from '@/components/shared/modals';

interface AddFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFilter: (filterType: FilterName) => void;
}

const AddFilterModal: React.FC<AddFilterModalProps> = ({ isOpen, onClose, onAddFilter }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredFilters = useMemo(() => {
    return filterTypes
      .filter((filter) =>
        getFilterDisplayName(filter).toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => getFilterDisplayName(a).localeCompare(getFilterDisplayName(b)));
  }, [searchTerm]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Filter"
      icon={<EffectsIcon className="w-4 sm:w-5 h-4 sm:h-5" />}
      iconColor="text-[rgb(var(--color-secondary))]"
      contentClassName="px-1"
      showFooter={true}
      footerProps={{
        showConfirm: false,
        closeText: 'Close',
      }}
      searchBar={<SearchBar value={searchTerm} onChange={setSearchTerm} />}
    >
      <div className="space-y-2 px-1">
        {filteredFilters.map((filterType) => (
          <button
            key={filterType}
            onClick={() => {
              onAddFilter(filterType);
              onClose();
            }}
            className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
          >
            <span className="text-gray-900 dark:text-white text-sm">
              {getFilterDisplayName(filterType)}
            </span>
          </button>
        ))}
      </div>
    </BaseModal>
  );
};

export default AddFilterModal;
