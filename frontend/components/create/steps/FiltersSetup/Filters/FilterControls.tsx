import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';

import type { FilterInstance, FilterName, FilterOptions } from '@/types/effect';

import { useFilters } from '@/components/store/filters/hook';
import { getFilterDisplayName } from '@/components/store/filters/main/utils/filterUtils';

import Toggle from '@/components/shared/Toggle';
import RegularSlider from '@/components/shared/RegularSlider';
import SmallNumericStepper from '@/components/shared/SmallNumericStepper';

import ColorPicker from '../ColorPicker';
import BicolorPresets from './bicolor components/BicolorPresetsModal';
import RetroPresetsPalette from './retro palette components/RetroPresetsModal';

import { AsciiArtControls } from './ascii art components/AsciiArtControls';
import { CharsetPresetsModal } from './ascii art components/CharsetPresetsModal';

import { categories } from './ascii art components/categories';
import { RETRO_PRESETS } from './retro palette components/retroPresets';
import DitheringControls from './dithering components';
import { ControlRow } from './common/ControlRow';

import { BadTvControls } from './bad tv components';
import { DragIcon, ChevronDownIcon } from '@/components/icons';

interface FilterControlProps {
  filterName: FilterName;
  filter: FilterInstance;
  updateFilter: (filterId: string, updates: Partial<FilterOptions>) => void;
  onToggleFilter: () => void;
  onRemoveFilter: () => void;
  isExpanded?: boolean;
  onToggleExpansion?: () => void;
  isAnimated?: boolean;
}

const FilterControl: React.FC<FilterControlProps> = ({
  filterName,
  filter,
  updateFilter,
  onToggleFilter,
  onRemoveFilter,
  isExpanded = false,
  onToggleExpansion,
  isAnimated,
}) => {
  const allPresets = categories.flatMap((cat) => cat.presets);
  const { toggleFilterMetadata } = useFilters();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSorting,
  } = useSortable({
    id: filter.id,
    data: {
      type: 'filter',
    },
  });

  const style = {
    transform: transform
      ? `translate3d(${Math.min(Math.max(transform.x, -10), 10)}px, ${transform.y}px, 0px)`
      : undefined,
    transition,
    opacity: isSorting ? 0.4 : 1,
  };

  useEffect(() => {
    if (filterName === 'retro_Palette' && !filter.presetName) {
      const defaultPreset = RETRO_PRESETS.find((p) => p.name === 'A64');
      if (defaultPreset) {
        updateFilter(filter.id, { presetName: defaultPreset.name, palette: defaultPreset.colors });
      }
    }
  }, [filterName, filter.id, filter.presetName, updateFilter]);

  const handleIntensityChange = (newIntensity: number) => {
    const clampedIntensity = Math.min(Math.max(newIntensity, 0), 100);
    updateFilter(filter.id, { intensity: clampedIntensity });
  };

  const handleRadiusChange = (newRadius: number) => {
    const clampedRadius = Math.min(Math.max(newRadius, 0), 100);
    updateFilter(filter.id, { radius: clampedRadius });
  };

  const handleColorChange1 = (color: string) => {
    updateFilter(filter.id, { color1: color });
  };

  const handleColorChange2 = (color: string) => {
    updateFilter(filter.id, { color2: color });
  };

  const renderColorControls = () => {
    if (filterName === 'border_Simple') {
      return (
        <>
          <span className="text-xs sm:text-sm font-bold whitespace-nowrap">Border color:</span>
          <ColorPicker color={filter.color1 ?? '#000000'} onChange={handleColorChange1} />
        </>
      );
    } else if (
      filterName === 'border_Double' ||
      filterName === 'duotone' ||
      filterName === 'ascii_Art'
    ) {
      return (
        <>
          <span className="text-xs sm:text-sm font-bold whitespace-nowrap">
            {filterName === 'border_Double'
              ? 'External:'
              : filterName === 'ascii_Art'
                ? 'Background:'
                : 'Color 1:'}
          </span>
          <ColorPicker color={filter.color1 ?? '#000000'} onChange={handleColorChange1} />
          <span className="text-xs sm:text-sm font-bold whitespace-nowrap">
            {filterName === 'border_Double'
              ? 'Internal:'
              : filterName === 'ascii_Art'
                ? 'Characters:'
                : 'Color 2:'}
          </span>
          <ColorPicker color={filter.color2 ?? '#FFFFFF'} onChange={handleColorChange2} />
          <button
            type="button"
            className="ml-2 px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-xs font-semibold"
            onClick={() =>
              updateFilter(filter.id, { color1: filter.color2, color2: filter.color1 })
            }
            title="Invert colors"
          >
            Invert
          </button>
        </>
      );
    }
    return null;
  };

  const renderAsciiArtControls = () => {
    if (filterName === 'ascii_Art') {
      return (
        <AsciiArtControls
          filter={filter}
          updateFilter={(updates) => updateFilter(filter.id, updates)}
        />
      );
    }
    return null;
  };

  const renderDitheringControls = () => {
    if (filterName === 'dithering') {
      return <DitheringControls filter={filter} updateFilter={updateFilter} />;
    }
    return null;
  };

  const renderBadTvControls = () => {
    if (filterName === 'bad_TV') {
      return (
        <BadTvControls
          filter={filter}
          updateFilter={(updates) => updateFilter(filter.id, updates)}
          isAnimated={isAnimated}
        />
      );
    }
    return null;
  };

  const renderTintControls = () => {
    if (filterName === 'tint') {
      return (
        <div className="flex items-center space-x-4">
          <ColorPicker
            color={filter.tintColor ?? '#FF6B6B'}
            onChange={(color) => updateFilter(filter.id, { tintColor: color })}
          />
          <div className="grow relative flex items-center">
            <RegularSlider
              value={filter.tintIntensity ?? 50}
              onChange={(value) => updateFilter(filter.id, { tintIntensity: value })}
              min={1}
              max={100}
              step={1}
              activeColor="rgb(var(--color-secondary))"
            />
          </div>
          <div className="flex items-center space-x-1">
            <SmallNumericStepper
              value={filter.tintIntensity ?? 50}
              onChange={(value) => updateFilter(filter.id, { tintIntensity: value })}
              min={0}
              max={100}
              step={1}
            />
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        position: 'relative',
        zIndex: isSorting ? 999 : 1,
      }}
      className={`mb-2 px-4 py-2 rounded-lg shadow-md border transition-all duration-200 ${
        filter.enabled
          ? 'bg-white dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600/50'
          : 'bg-gray-100 dark:bg-gray-900/80 text-gray-500 dark:text-gray-500 border-gray-300 dark:border-gray-600/50'
      } ${isSorting ? 'shadow-lg ring-2 ring-purple-500/50' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpansion?.();
          }}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-[rgb(var(--color-secondary))] mr-2"
        >
          <ChevronDownIcon
            className={`w-5 h-5 transition-transform duration-300 cursor-pointer ${
              isExpanded ? '' : '-rotate-90'
            }`}
          />
        </button>

        <div
          {...attributes}
          {...listeners}
          className="flex items-center space-x-2 flex-1 cursor-grab active:cursor-grabbing"
        >
          <DragIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <span
            className={`font-bold ${filter.enabled ? 'text-[rgb(var(--color-accent))]' : 'text-gray-400 dark:text-gray-500'}`}
          >
            {getFilterDisplayName(filterName)}
          </span>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          {filter.enabled &&
            (filterName === 'border_Double' ||
              filterName === 'duotone' ||
              filterName === 'ascii_Art') && (
              <>
                <BicolorPresets
                  onApplyPreset={(colors) => {
                    updateFilter(filter.id, { color1: colors[0], color2: colors[1] });
                  }}
                  filterName={filterName}
                />
                {filterName === 'ascii_Art' && (
                  <CharsetPresetsModal
                    categories={categories}
                    selectedCharset={filter.charset ?? ''}
                    onSelectCharset={(charset) => {
                      const preset = allPresets.find((p) => p.charset === charset);
                      if (preset) {
                        updateFilter(filter.id, {
                          charset,
                          fontName: preset.font,
                        });
                      }
                    }}
                  />
                )}
              </>
            )}
          {filter.enabled && filterName === 'retro_Palette' && (
            <RetroPresetsPalette
              onApplyPreset={(palette, presetName) => {
                updateFilter(filter.id, { palette, presetName });
              }}
            />
          )}
          <motion.button
            onClick={onRemoveFilter}
            className="px-2 py-1 rounded-md text-xs font-medium bg-[rgb(var(--color-quaternary)/0.1)] dark:bg-[rgb(var(--color-quaternary)/0.3)] text-[rgb(var(--color-quaternary))] dark:text-[rgb(var(--color-quaternary-dark))] hover:bg-[rgb(var(--color-quaternary)/0.2)] dark:hover:bg-[rgb(var(--color-quaternary)/0.4)] cursor-pointer"
          >
            Remove
          </motion.button>
          <Toggle
            checked={filter.enabled}
            onChange={onToggleFilter}
            size="md"
            activeColor="bg-[rgb(var(--color-accent))]"
            inactiveColor="bg-gray-300 dark:bg-gray-600"
            thumbColor="bg-white"
          />
        </div>
      </div>
      <AnimatePresence mode="wait">
        {isExpanded && filter.enabled ? (
          <motion.div
            key="enabled"
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{
              duration: 0.3,
              ease: 'easeInOut',
              height: { duration: 0.3, ease: 'easeInOut' },
            }}
          >
            {filterName === 'retro_Palette' ? (
              <div className="flex flex-col space-y-3">
                <p className="text-sm font-bold">
                  <span className="text-[rgb(var(--color-secondary))]">Preset:</span>{' '}
                  <span className="italic text-[rgb(var(--color-accent))] ml-2">
                    {filter.presetName}
                  </span>
                </p>
                <div className="flex flex-wrap">
                  {(filter.palette ?? []).map((color, index) => (
                    <div
                      key={index}
                      className="w-2 h-2 m-0.5"
                      style={{ backgroundColor: `rgb(${color.join(',')})` }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-4">
                {filterName !== 'ascii_Art' &&
                  filterName !== 'dithering' &&
                  filterName !== 'tint' && (
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-bold text-[rgb(var(--color-secondary))] w-16 mr-6">
                        Intensity:
                      </span>
                      <div className="grow relative flex items-center">
                        <RegularSlider
                          value={filter.intensity}
                          onChange={handleIntensityChange}
                          min={1}
                          max={100}
                          step={1}
                          activeColor="rgb(var(--color-secondary))"
                        />
                      </div>
                      <div className="flex items-center space-x-1">
                        <SmallNumericStepper
                          value={filter.intensity}
                          onChange={handleIntensityChange}
                          min={0}
                          max={100}
                          step={1}
                        />
                      </div>
                    </div>
                  )}
                {(filterName === 'oil_Painting' || filterName === 'paint_on_canvas') && (
                  <ControlRow
                    label="Radius"
                    value={filter.radius ?? 50}
                    onChange={handleRadiusChange}
                    min={1}
                    max={100}
                    step={1}
                    color="rgb(var(--color-accent))"
                  />
                )}
              </div>
            )}
            {renderAsciiArtControls()}
            {renderDitheringControls()}
            {renderBadTvControls()}
            {renderTintControls()}
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 mt-4">
              <div className="flex items-center space-x-2">
                <span className="text-xs sm:text-sm font-bold whitespace-nowrap">
                  Include in metadata?
                </span>
                <Toggle
                  checked={filter.includeInMetadata}
                  onChange={() => toggleFilterMetadata(filter.id)}
                  size="sm"
                  activeColor="bg-[rgb(var(--color-secondary))]"
                  inactiveColor="bg-gray-300 dark:bg-gray-600"
                  thumbColor="bg-white"
                />
              </div>
            </div>

            {(filterName === 'duotone' ||
              filterName === 'border_Double' ||
              filterName === 'border_Simple' ||
              filterName === 'ascii_Art') && (
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-4">
                {renderColorControls()}
              </div>
            )}
          </motion.div>
        ) : isExpanded && !filter.enabled ? (
          <motion.div
            key="disabled"
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{
              duration: 0.3,
              ease: 'easeInOut',
              height: { duration: 0.3, ease: 'easeInOut' },
            }}
            className="text-gray-500 dark:text-gray-400 text-sm italic py-2"
          >
            Filter is currently disabled and will not count for preview. Enable it to see
            configuration options.
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default FilterControl;
