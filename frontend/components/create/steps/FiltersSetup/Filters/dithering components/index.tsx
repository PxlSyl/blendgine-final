import React from 'react';

import { FilterInstance } from '@/schemas/effect/filters/common';
import { FILTER_BLEND_MODES, FilterBlendMode } from '@/types/blendModes';

import { useDitheringControls } from './useDitheringControls';
import { algorithms, bayerMatrixSizes, halftoneShapes } from './constants';

import Dropdown from '@/components/shared/Dropdown';
import { DitheringInfo } from './components/DitheringInfo';
import ErrorDiffusionControls from './components/ErrorDiffusionControls';
import { ControlRow } from '../common/ControlRow';

interface DitheringControlsProps {
  filter: FilterInstance;
  updateFilter: (filterId: string, updates: Partial<FilterInstance>) => void;
}

const DitheringControls: React.FC<DitheringControlsProps> = ({ filter, updateFilter }) => {
  const updateFilterWrapper = (updates: Partial<FilterInstance>) => {
    updateFilter(filter.id, updates);
  };

  const {
    handleAlgorithmChange,
    handleColorReductionChange,
    handleDiffusionThresholdChange,
    handleBayerMatrixSizeChange,
    handleSierraVariantChange,
    handleClusteredDotShapeChange,
    handleHalftoneShapeChange,
    handleHalftoneAngleChange,
    handleHalftoneFrequencyChange,
    handleHalftoneOverlapChange,
    handleCustomFactorsChange,
    handleBlendModeChange,
    handleIntensityChange,
  } = useDitheringControls({ filter, updateFilter });

  return (
    <div className="flex flex-col gap-2 mt-2">
      <div className="flex items-center space-x-4 pt-3 border-t border-gray-200 dark:border-gray-600">
        <span className="text-xs font-bold text-[rgb(var(--color-primary))] w-24">Algorithm</span>
        <div className="grow">
          <Dropdown
            options={algorithms.map((alg) => alg.label)}
            value={
              algorithms.find((alg) => alg.value === (filter.ditherAlgorithm ?? 'floydsteinberg'))
                ?.label ?? 'Floyd-Steinberg'
            }
            onChange={(selectedLabel) => {
              const algorithm = algorithms.find((alg) => alg.label === selectedLabel);
              if (algorithm) {
                handleAlgorithmChange(algorithm.value);
              }
            }}
            placeholder="Select algorithm"
            textColorClass="text-gray-700 dark:text-gray-300 text-sm"
          />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-xs font-bold text-[rgb(var(--color-primary))] w-24">Blend Mode</span>
        <div className="grow">
          <Dropdown
            options={Object.keys(FILTER_BLEND_MODES).map(
              (mode) => mode.charAt(0).toUpperCase() + mode.slice(1)
            )}
            value={
              filter.filterBlendMode
                ? filter.filterBlendMode.charAt(0).toUpperCase() + filter.filterBlendMode.slice(1)
                : 'Mix'
            }
            onChange={(selectedLabel) => {
              const mode = selectedLabel.toLowerCase() as FilterBlendMode;
              handleBlendModeChange(mode);
            }}
            placeholder="Select blend mode"
            textColorClass="text-gray-700 dark:text-gray-300 text-sm"
          />
        </div>
      </div>
      {(filter.filterBlendMode === 'mix' || !filter.filterBlendMode) && (
        <ControlRow
          label="Intensity"
          value={filter.intensity ?? 100}
          onChange={handleIntensityChange}
          min={0}
          max={100}
          step={1}
          color="rgb(var(--color-primary))"
        />
      )}

      <ErrorDiffusionControls
        filter={filter}
        updateFilter={updateFilterWrapper}
        handleColorReductionChange={handleColorReductionChange}
        handleDiffusionThresholdChange={handleDiffusionThresholdChange}
        handleSierraVariantChange={handleSierraVariantChange}
        handleCustomFactorsChange={handleCustomFactorsChange}
      />

      {filter.ditherAlgorithm === 'bayer' && (
        <>
          <div className="flex items-center space-x-4">
            <span className="text-xs font-bold text-[rgb(var(--color-secondary))] w-24">
              Matrix Size
            </span>
            <div className="grow">
              <Dropdown
                options={bayerMatrixSizes.map((size) => size.value.toString())}
                value={(filter.bayerOptions?.matrixSize ?? 4).toString()}
                onChange={(option) => handleBayerMatrixSizeChange(parseInt(option))}
                placeholder="Select matrix size"
                textColorClass="text-gray-700 dark:text-gray-300 text-sm"
                renderOption={(option) => (
                  <div className="py-1 px-2">
                    {bayerMatrixSizes.find((size) => size.value.toString() === option)?.label ??
                      option}
                  </div>
                )}
              />
            </div>
          </div>
          <ControlRow
            label="Color Reduction"
            value={filter.colorReduction ?? 16}
            onChange={handleColorReductionChange}
            min={2}
            max={255}
            step={1}
            color="rgb(var(--color-secondary))"
          />
        </>
      )}

      {filter.ditherAlgorithm === 'clustereddot' && (
        <>
          <div className="flex items-center space-x-4">
            <span className="text-xs font-bold text-[rgb(var(--color-secondary))] w-24">Shape</span>
            <div className="grow">
              <Dropdown
                options={['Round', 'Square', 'Elliptical']}
                value={
                  (filter.clusteredDotOptions?.shape ?? 'round') === 'round'
                    ? 'Round'
                    : (filter.clusteredDotOptions?.shape ?? 'round') === 'square'
                      ? 'Square'
                      : 'Elliptical'
                }
                onChange={(selectedLabel) => {
                  const shape = selectedLabel.toLowerCase() as 'round' | 'square' | 'elliptical';
                  handleClusteredDotShapeChange(shape);
                }}
                placeholder="Select shape"
                textColorClass="text-gray-700 dark:text-gray-300 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xs font-bold text-[rgb(var(--color-secondary))] w-24">
              Matrix Size
            </span>
            <div className="grow">
              <Dropdown
                options={['8', '16']}
                value={(filter.clusteredDotOptions?.matrixSize ?? 8).toString()}
                onChange={(option) => {
                  const currentOptions = filter.clusteredDotOptions ?? {
                    shape: 'round',
                    matrixSize: 8,
                  };
                  updateFilter(filter.id, {
                    clusteredDotOptions: {
                      ...currentOptions,
                      matrixSize: parseInt(option) as 8 | 16,
                      shape: currentOptions.shape ?? 'round',
                    },
                  });
                }}
                placeholder="Select matrix size"
                textColorClass="text-gray-700 dark:text-gray-300 text-sm"
              />
            </div>
          </div>

          <ControlRow
            label="Color Reduction"
            value={filter.colorReduction ?? 16}
            onChange={handleColorReductionChange}
            min={2}
            max={255}
            step={1}
            color="rgb(var(--color-secondary))"
          />
        </>
      )}

      {filter.ditherAlgorithm === 'halftone' && (
        <>
          <div className="flex items-center space-x-4">
            <span className="text-xs font-bold text-[rgb(var(--color-secondary))] w-24">Shape</span>
            <div className="grow">
              <Dropdown
                options={halftoneShapes.map((shape) => shape.label)}
                value={
                  halftoneShapes.find(
                    (shape) => shape.value === (filter.halftoneOptions?.shape ?? 'circle')
                  )?.label ?? 'Circle'
                }
                onChange={(selectedLabel) => {
                  const shape = halftoneShapes.find((shape) => shape.label === selectedLabel);
                  if (shape) {
                    handleHalftoneShapeChange(shape.value);
                  }
                }}
                placeholder="Select halftone shape"
                textColorClass="text-gray-700 dark:text-gray-300 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-xs font-bold text-[rgb(var(--color-secondary))] w-24">Angle</span>
            <div className="grow">
              <Dropdown
                options={['0°', '15°', '30°', '45°', '60°', '75°', '90°']}
                value={`${filter.halftoneOptions?.angle ?? 45}°`}
                onChange={(option) => {
                  const angle = parseInt(option.replace('°', ''));
                  handleHalftoneAngleChange(angle);
                }}
                placeholder="Select angle"
                textColorClass="text-gray-700 dark:text-gray-300 text-sm"
              />
            </div>
          </div>

          <ControlRow
            label="Frequency"
            value={filter.halftoneOptions?.frequency ?? 150}
            onChange={(value) => handleHalftoneFrequencyChange(value)}
            min={50}
            max={300}
            step={10}
            color="rgb(var(--color-secondary))"
          />

          <ControlRow
            label="Overlap"
            value={(filter.halftoneOptions?.overlap ?? 0.1) * 100}
            onChange={(value) => handleHalftoneOverlapChange(value / 100)}
            min={0}
            max={50}
            step={1}
            color="rgb(var(--color-secondary))"
          />

          <ControlRow
            label="Color Reduction"
            value={filter.colorReduction ?? 16}
            onChange={handleColorReductionChange}
            min={2}
            max={255}
            step={1}
            color="rgb(var(--color-secondary))"
          />
        </>
      )}

      <DitheringInfo filter={filter} />
      <div className="border-t border-gray-200 dark:border-gray-600 mt-1"></div>
    </div>
  );
};

export default DitheringControls;
