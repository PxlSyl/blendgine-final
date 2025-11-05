import React from 'react';

import { InfoIcon, AttentionIcon, LinkIcon } from '@/components/icons';
import HeaderButton from '@/components/shared/HeaderButton';

interface CombinationNavProps {
  activeMode: 'incompatibilities' | 'forced';
  setActiveMode: (mode: 'incompatibilities' | 'forced') => void;
}

const CombinationNav: React.FC<CombinationNavProps> = ({ activeMode, setActiveMode }) => {
  return (
    <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <HeaderButton
            isActive={activeMode === 'incompatibilities'}
            onClick={() => setActiveMode('incompatibilities')}
            icon={<AttentionIcon className="w-4 h-4" />}
          >
            Incompatibilities
          </HeaderButton>

          <HeaderButton
            isActive={activeMode === 'forced'}
            onClick={() => setActiveMode('forced')}
            icon={<LinkIcon className="w-4 h-4" />}
          >
            Forced
          </HeaderButton>
        </div>

        <div className="text-sm italic hidden sm:flex items-center justify-end text-gray-600 dark:text-gray-300">
          <InfoIcon className="w-5 h-5 mr-2 shrink-0" />
          <span>Rules will be applied only to the selected set.</span>
        </div>
      </div>
    </div>
  );
};

export default CombinationNav;
