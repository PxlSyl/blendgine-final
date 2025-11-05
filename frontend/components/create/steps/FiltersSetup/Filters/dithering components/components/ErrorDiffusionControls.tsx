import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FilterInstance } from '@/schemas/effect/filters/common';
import Dropdown from '@/components/shared/Dropdown';
import CheckboxWithLabel from '@/components/shared/CheckboxWithLabel';
import SmallNumericStepper from '@/components/shared/SmallNumericStepper';
import { ControlRow } from '../../common/ControlRow';

import { sierraVariants } from '../constants';
import { getDefaultFactors, getFactorLabel, getGridCols } from '../utils';

interface ErrorDiffusionControlsProps {
  filter: FilterInstance;
  updateFilter: (updates: Partial<FilterInstance>) => void;
  handleColorReductionChange: (value: number) => void;
  handleDiffusionThresholdChange: (value: number) => void;
  handleSierraVariantChange: (variant: string) => void;
  handleCustomFactorsChange: (factors: number[]) => void;
}

const ErrorDiffusionControls: React.FC<ErrorDiffusionControlsProps> = ({
  filter,
  updateFilter,
  handleColorReductionChange,
  handleDiffusionThresholdChange,
  handleSierraVariantChange,
  handleCustomFactorsChange,
}) => {
  const isErrorDiffusionAlgorithm = [
    'floydsteinberg',
    'jarvisjudiceninke',
    'atkinson',
    'burkes',
    'stevensonarce',
    'stucki',
    'sierra',
  ].includes(filter.ditherAlgorithm ?? 'floydsteinberg');

  if (!isErrorDiffusionAlgorithm) {
    return null;
  }

  return (
    <>
      {filter.ditherAlgorithm === 'sierra' && (
        <div className="flex items-center space-x-4">
          <span className="text-xs font-bold text-[rgb(var(--color-secondary))] w-24">Variant</span>
          <div className="grow">
            <Dropdown
              options={sierraVariants.map((variant) => variant.label)}
              value={
                sierraVariants.find(
                  (variant) => variant.value === (filter.sierraOptions?.variant ?? 'sierra')
                )?.label ?? 'Sierra'
              }
              onChange={(selectedLabel) => {
                const variant = sierraVariants.find((variant) => variant.label === selectedLabel);
                if (variant) {
                  handleSierraVariantChange(variant.value);
                }
              }}
              placeholder="Select Sierra variant"
              textColorClass="text-gray-700 dark:text-gray-300 text-sm"
            />
          </div>
        </div>
      )}

      <div className="flex items-center space-x-4">
        <span className="text-xs font-bold text-[rgb(var(--color-secondary))] w-24">Diffusion</span>
        <div className="grow">
          <Dropdown
            options={['Standard', 'Serpentine']}
            value={filter.diffusionDirection === 'serpentine' ? 'Serpentine' : 'Standard'}
            onChange={(option) => {
              const direction = option === 'Serpentine' ? 'serpentine' : 'lefttoright';
              updateFilter({ diffusionDirection: direction });
            }}
            placeholder="Select direction"
            textColorClass="text-gray-700 dark:text-gray-300 text-sm"
          />
        </div>
      </div>

      <ControlRow
        label="Threshold"
        value={filter.diffusionThreshold ?? 128}
        onChange={handleDiffusionThresholdChange}
        min={0}
        max={255}
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

      <div className="space-y-3">
        <CheckboxWithLabel
          label={<span className="text-[rgb(var(--color-primary))]">Custom Factors?</span>}
          checked={filter.customFactors !== undefined}
          onChange={(checked) => {
            if (checked) {
              let defaultFactors;
              if (filter.ditherAlgorithm === 'sierra') {
                const variant = filter.sierraOptions?.variant ?? 'sierra';
                defaultFactors = getDefaultFactors(variant);
              } else {
                defaultFactors = getDefaultFactors(filter.ditherAlgorithm ?? 'floydsteinberg');
              }
              updateFilter({ customFactors: defaultFactors as number[] });
            } else {
              updateFilter({ customFactors: undefined });
            }
          }}
        />

        <AnimatePresence>
          {filter.customFactors &&
            filter.ditherAlgorithm !== 'bayer' &&
            filter.ditherAlgorithm !== 'clustereddot' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div
                    className={`grid gap-2 ${(() => {
                      if (filter.ditherAlgorithm === 'sierra') {
                        const variant = filter.sierraOptions?.variant ?? 'sierra';
                        return getGridCols(variant);
                      }
                      return getGridCols(filter.ditherAlgorithm ?? 'floydsteinberg');
                    })()}`}
                  >
                    {filter.customFactors.map((factor, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <span className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {(() => {
                            if (filter.ditherAlgorithm === 'sierra') {
                              const variant = filter.sierraOptions?.variant ?? 'sierra';
                              return getFactorLabel(variant, index);
                            }
                            return getFactorLabel(
                              filter.ditherAlgorithm ?? 'floydsteinberg',
                              index
                            );
                          })()}
                        </span>
                        <SmallNumericStepper
                          value={Math.round(factor * 100)}
                          onChange={(value) => {
                            const newFactors = [...(filter.customFactors ?? [])];
                            newFactors[index] = value / 100;
                            handleCustomFactorsChange(newFactors);
                          }}
                          min={0}
                          max={100}
                          step={1}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
        </AnimatePresence>
      </div>
    </>
  );
};
export default ErrorDiffusionControls;
