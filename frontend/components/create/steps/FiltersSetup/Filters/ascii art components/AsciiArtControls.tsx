import React from 'react';
import { FilterOptions } from '@/types/effect';
import { ControlRow } from '../common/ControlRow';
import { categories } from './categories';

interface AsciiArtControlsProps {
  filter: FilterOptions;
  updateFilter: (updates: Partial<FilterOptions>) => void;
}

export const AsciiArtControls: React.FC<AsciiArtControlsProps> = ({ filter, updateFilter }) => {
  const handleFontSizeChange = (value: number) => {
    updateFilter({ fontSize: Math.max(6, Math.min(48, value)) });
  };

  const handleBlockSizeChange = (value: number) => {
    updateFilter({ blockSize: Math.max(2, Math.min(32, value)) });
  };

  const getPresetName = (charset: string) => {
    for (const category of categories) {
      const preset = category.presets.find((p) => p.charset === charset);
      if (preset) {
        return preset.name;
      }
    }
    return 'Default';
  };

  return (
    <div className="flex flex-col gap-2 mt-2">
      <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center space-x-4 mb-2">
          <span className="text-xs font-bold text-[rgb(var(--color-primary))] w-24">
            Charset Preset:
          </span>
          <span className="text-xs text-[rgb(var(--color-accent))] italic">
            {getPresetName(filter.charset ?? '')}
          </span>
        </div>

        <ControlRow
          label="Font Size"
          value={filter.fontSize ?? 14}
          onChange={handleFontSizeChange}
          min={6}
          max={48}
          step={1}
          color="rgb(var(--color-secondary))"
        />

        <ControlRow
          label="Block Size"
          value={filter.blockSize ?? 8}
          onChange={handleBlockSizeChange}
          min={2}
          max={32}
          step={1}
          color="rgb(var(--color-secondary))"
        />
      </div>
      <div className="border-t border-gray-200 dark:border-gray-600 mt-1"></div>
    </div>
  );
};
