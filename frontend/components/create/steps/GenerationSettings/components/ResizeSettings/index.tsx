import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { InfoIcon } from '@/components/icons';
import Dropdown from '@/components/shared/Dropdown';
import { NumericInputWithButtons } from '@/components/shared/NumericInputWithButtons';

import type { ResizeConfig } from '@/types/effect';
import {
  getAlgorithmDescription,
  getAlgorithmDisplayName,
  getFilterDisplayName,
  resizeAlgorithms,
  resizeFilters,
} from './config';

interface ResizeSettingsProps {
  resizeConfig: ResizeConfig;
  updateResizeConfig: (config: Partial<ResizeConfig>) => void;
  transitionVariants: {
    hidden: { opacity: number; y: number };
    visible: { opacity: number; y: number };
    exit: { opacity: number; y: number };
  };
}

export const ResizeSettings: React.FC<ResizeSettingsProps> = ({
  resizeConfig,
  updateResizeConfig,
  transitionVariants,
}) => {
  const handleResizeAlgorithmChange = useCallback(
    (algorithm: (typeof resizeAlgorithms)[number]) => {
      updateResizeConfig({
        ...resizeConfig,
        algorithm,
        superSamplingFactor:
          algorithm === 'SUPERSAMPLING'
            ? (resizeConfig.superSamplingFactor ?? 2)
            : resizeConfig.superSamplingFactor,
      });
    },
    [updateResizeConfig, resizeConfig]
  );

  const handleResizeFilterChange = useCallback(
    (filter: (typeof resizeFilters)[number]) => {
      updateResizeConfig({
        ...resizeConfig,
        filter,
      });
    },
    [updateResizeConfig, resizeConfig]
  );

  const handleSuperSamplingFactorChange = useCallback(
    (factor: number) => {
      updateResizeConfig({
        ...resizeConfig,
        superSamplingFactor: factor,
      });
    },
    [updateResizeConfig, resizeConfig]
  );

  return (
    <motion.div
      variants={transitionVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="p-2 rounded-sm shadow-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
    >
      <motion.h3 layout className="text-md font-semibold text-[rgb(var(--color-primary))] mb-4">
        Resize Settings
      </motion.h3>

      <motion.div layout className="space-y-4">
        <div className="relative z-999">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Resize Algorithm
          </label>
          <Dropdown
            options={[...resizeAlgorithms]}
            value={resizeConfig.algorithm}
            onChange={(value) =>
              handleResizeAlgorithmChange(value as (typeof resizeAlgorithms)[number])
            }
            placeholder="Select resize algorithm"
            textColorClass="text-gray-500 dark:text-gray-400"
            hoverBgClass="hover:bg-gray-50 dark:hover:bg-gray-600"
            renderOption={(option) => getAlgorithmDisplayName(option)}
            renderValue={(value) => getAlgorithmDisplayName(value)}
          />
        </div>

        <AnimatePresence mode="wait">
          {(resizeConfig.algorithm === 'CONVOLUTION' ||
            resizeConfig.algorithm === 'INTERPOLATION' ||
            resizeConfig.algorithm === 'SUPERSAMPLING') && (
            <motion.div
              key="resize-filter"
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="relative z-999">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Resize Filter
                </label>
                <Dropdown
                  options={[...resizeFilters]}
                  value={resizeConfig.filter ?? 'BILINEAR'}
                  onChange={(value) =>
                    handleResizeFilterChange(value as (typeof resizeFilters)[number])
                  }
                  placeholder="Select resize filter"
                  textColorClass="text-gray-500 dark:text-gray-400"
                  hoverBgClass="hover:bg-gray-50 dark:hover:bg-gray-600"
                  renderOption={(option) => getFilterDisplayName(option)}
                  renderValue={(value) => getFilterDisplayName(value)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {resizeConfig.algorithm === 'SUPERSAMPLING' && (
            <motion.div
              key="super-sampling-factor"
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="relative z-999">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Super Sampling Factor
                </label>
                <NumericInputWithButtons
                  label=""
                  value={(resizeConfig.superSamplingFactor ?? 2).toString()}
                  onChange={(value) => handleSuperSamplingFactorChange(parseInt(value))}
                  min={1}
                  max={8}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-sm italic flex items-center text-gray-500 dark:text-gray-400">
          <InfoIcon className="w-6 h-6 mr-2 shrink-0" />
          <span className="flex-1">
            {getAlgorithmDescription(resizeConfig.algorithm, resizeConfig.filter)}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ResizeSettings;
