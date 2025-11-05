import React from 'react';
import { useFilters } from '@/components/store/filters/hook';
import FlipFlopMetadataToggle from './IncludeFlipFlopData';
import { InfoIcon } from '@/components/icons';
import { ControlRow } from '../Filters/common/ControlRow';

const FlipOptions: React.FC = () => {
  const { flipOptions, updateFlipOptions } = useFilters();

  const safeFlipOptions = flipOptions || { horizontalFlipPercentage: 0, verticalFlipPercentage: 0 };

  const handleFlipChange = (type: 'horizontal' | 'vertical', value: number) => {
    const boundedValue = Math.min(Math.max(value, 0), 100);
    updateFlipOptions({ [`${type}FlipPercentage`]: boundedValue });
  };

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <div className="text-md sm:text-lg font-semibold text-[rgb(var(--color-primary))]">
          Flip Options
        </div>
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 ml-4">
          <InfoIcon className="w-5 h-5 mr-2" />
          <span className="italic">Flip options can be combined with the filters below.</span>
        </div>
      </div>
      <FlipFlopMetadataToggle />
      <div className="p-2">
        <div className="flex flex-wrap gap-2">
          {['horizontal', 'vertical'].map((type) => (
            <div
              key={type}
              className="w-full min-w-[200px] flex-1 px-2 py-2 rounded-lg shadow-md bg-white dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600/50"
            >
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">
                {type.charAt(0).toUpperCase() + type.slice(1)} Flip
              </label>

              <ControlRow
                label=""
                value={
                  type === 'horizontal'
                    ? safeFlipOptions.horizontalFlipPercentage
                    : safeFlipOptions.verticalFlipPercentage
                }
                onChange={(value) =>
                  handleFlipChange(type as 'horizontal' | 'vertical', Math.round(value))
                }
                min={0}
                max={100}
                step={1}
                color="rgb(var(--color-accent))"
                showLabel={false}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default FlipOptions;
