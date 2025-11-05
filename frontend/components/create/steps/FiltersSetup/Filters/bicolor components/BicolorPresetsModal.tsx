import React, { useState, useMemo } from 'react';

import { BICOLOR_PRESETS } from './bicolorsPresets';

import SearchBar from '@/components/shared/SearchBar';
import { PaletteIcon } from '@/components/icons';
import { ActionButton } from '@/components/shared/ActionButton';
import { BaseModal } from '@/components/shared/modals';

interface Preset {
  name: string;
  colors: string[];
}

interface BicolorPresetsProps {
  filterName: string;
  onApplyPreset: (colors: string[]) => void;
}

const BicolorPresets: React.FC<BicolorPresetsProps> = ({ onApplyPreset, filterName }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const presets: Preset[] = useMemo(() => BICOLOR_PRESETS, []);

  const filteredPalettes = useMemo(
    () =>
      presets
        .filter((palette) => palette.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [presets, searchTerm]
  );

  const getPresetTitle = () => {
    if (filterName === 'border_Simple') {
      return 'Border';
    }
    if (filterName === 'border_Double') {
      return 'Double Border';
    }
    if (filterName === 'ascii_Art') {
      return 'ASCII Art';
    }
    return 'Duotone';
  };

  return (
    <>
      <ActionButton
        label="Presets"
        description={`Choose ${getPresetTitle()} preset`}
        onClick={() => setIsOpen(true)}
        color="purple"
        icon={PaletteIcon}
      />

      <BaseModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={`Choose ${getPresetTitle()} Preset`}
        icon={<PaletteIcon className="w-4 sm:w-5 h-4 sm:h-5" />}
        iconColor="text-[rgb(var(--color-secondary))]"
        contentClassName="px-1"
        showFooter={true}
        footerProps={{
          showConfirm: false,
          closeText: 'Close',
        }}
        searchBar={<SearchBar value={searchTerm} onChange={setSearchTerm} />}
      >
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="space-y-2 px-1">
            {filteredPalettes.map((palette, index) => (
              <button
                key={index}
                className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
                onClick={() => {
                  onApplyPreset(
                    filterName === 'border_Simple' ? [palette.colors[0]] : palette.colors
                  );
                  setIsOpen(false);
                }}
              >
                <span className="text-gray-900 dark:text-white text-sm">{palette.name}</span>
                <div className="flex mt-1.5 gap-1">
                  <div
                    className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                    style={{ backgroundColor: palette.colors[0] }}
                  />
                  {(filterName === 'border_Double' ||
                    filterName === 'duotone' ||
                    filterName === 'ascii_Art') && (
                    <div
                      className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                      style={{ backgroundColor: palette.colors[1] }}
                    />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </BaseModal>
    </>
  );
};

export default BicolorPresets;
