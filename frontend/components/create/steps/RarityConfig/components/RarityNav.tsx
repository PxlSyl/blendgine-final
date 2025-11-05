import React from 'react';

import { InfoIcon, ChartsIcon, PercentageIcon } from '@/components/icons';
import HeaderButton from '@/components/shared/HeaderButton';

interface RarityNavProps {
  viewMode: 'settings' | 'visualization';
  setViewMode: (mode: 'settings' | 'visualization') => void;
}

const RarityNav: React.FC<RarityNavProps> = ({ viewMode, setViewMode }) => {
  return (
    <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <HeaderButton
            isActive={viewMode === 'settings'}
            onClick={() => setViewMode('settings')}
            icon={<PercentageIcon className="w-4 h-4" />}
          >
            Percentages
          </HeaderButton>

          <HeaderButton
            isActive={viewMode === 'visualization'}
            onClick={() => setViewMode('visualization')}
            icon={<ChartsIcon className="w-4 h-4" />}
          >
            Charts
          </HeaderButton>
        </div>
        <div className="text-sm italic hidden sm:flex items-center justify-end text-gray-600 dark:text-gray-300">
          <InfoIcon className="w-5 h-5 mr-2 shrink-0" />
          <span>
            {viewMode === 'settings'
              ? 'Set the rarity for each trait within each set of layers.'
              : 'Visualize your rarity settings.'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RarityNav;
