import React, { useState, useMemo } from 'react';
import { RETRO_PRESETS } from './retroPresets';
import { PaletteIcon } from '@/components/icons';
import SearchBar from '@/components/shared/SearchBar';
import { ActionButton } from '@/components/shared/ActionButton';
import { BaseModal } from '@/components/shared/modals';

interface Palette {
  name: string;
  colors: number[][];
}

interface RetroPresetsProps {
  onApplyPreset: (palette: number[][], presetName: string) => void;
}

const RetroPresetsPalette: React.FC<RetroPresetsProps> = ({ onApplyPreset }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const RetroPresets = RETRO_PRESETS as Palette[];
  const filteredPalettes = useMemo(
    () =>
      RetroPresets.filter((palette: Palette) =>
        palette.name.toLowerCase().includes(searchTerm.toLowerCase())
      ).sort((a: Palette, b: Palette) => a.name.localeCompare(b.name)),
    [searchTerm, RetroPresets]
  );

  const getModalTitle = () => {
    return 'Choose A Retro Palette';
  };

  const getButtonLabel = () => {
    return 'Presets';
  };

  const getButtonDescription = () => {
    return 'Choose retro palette preset';
  };

  const getIconColor = () => {
    return 'text-[rgb(var(--color-secondary))]';
  };

  return (
    <>
      <ActionButton
        label={getButtonLabel()}
        description={getButtonDescription()}
        onClick={() => setIsOpen(true)}
        color="purple"
        icon={PaletteIcon}
      />

      <BaseModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={getModalTitle()}
        icon={<PaletteIcon className="w-4 sm:w-5 h-4 sm:h-5" />}
        iconColor={getIconColor()}
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
            {filteredPalettes.map((palette: Palette, index: number) => (
              <button
                key={index}
                className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
                onClick={() => {
                  onApplyPreset(palette.colors, palette.name);
                  setIsOpen(false);
                }}
              >
                <span className="text-gray-900 dark:text-white text-sm">{palette.name}</span>
                <div className="flex mt-1.5 gap-1 flex-wrap">
                  {palette.colors.map((color: number[], colorIndex: number) => (
                    <div
                      key={colorIndex}
                      className="w-2 h-2 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})`,
                      }}
                    />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      </BaseModal>
    </>
  );
};

export default RetroPresetsPalette;
