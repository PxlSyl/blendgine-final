import React from 'react';
import { FilterOptions } from '@/types/effect';
import Dropdown from '@/components/shared/Dropdown';
import { CONTROL_CONFIGS } from './config';
import { ControlRow } from '../common/ControlRow';

interface BadTvControlsProps {
  filter: FilterOptions;
  updateFilter: (updates: Partial<FilterOptions>) => void;
  isAnimated?: boolean;
}
export const BadTvControls: React.FC<BadTvControlsProps> = ({
  filter,
  updateFilter,
  isAnimated = true,
}) => {
  const badTvOptions = filter.badTvOptions ?? {};

  const handleOptionChange = (key: keyof typeof badTvOptions, value: number) => {
    updateFilter({
      badTvOptions: { ...badTvOptions, [key]: value },
    });
  };

  const handleRollDirectionChange = (direction: string) => {
    const directionLower = direction.toLowerCase() as 'up' | 'down' | 'left' | 'right';
    updateFilter({
      badTvOptions: { ...badTvOptions, rollDirection: directionLower },
    });
  };

  return (
    <div className="flex flex-col gap-2 mt-2">
      <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
        {CONTROL_CONFIGS.map(({ key, label, defaultValue, min, max, step, color }) => {
          if (!isAnimated && (key === 'rollSpeed' || key === 'frameJumpIntensity')) {
            return null;
          }

          return (
            <ControlRow
              key={key}
              label={label}
              value={badTvOptions[key] ?? defaultValue}
              onChange={(value) => handleOptionChange(key, value)}
              min={min}
              max={max}
              step={step}
              color={color}
            />
          );
        })}

        {isAnimated && (
          <div className="flex items-center space-x-4 mb-2">
            <span className="text-xs font-bold text-[rgb(var(--color-secondary))] w-24">
              Roll Direction:
            </span>
            <div className="grow">
              <Dropdown
                options={['Up', 'Down', 'Left', 'Right']}
                value={
                  (badTvOptions.rollDirection ?? 'up').charAt(0).toUpperCase() +
                  (badTvOptions.rollDirection ?? 'up').slice(1)
                }
                onChange={handleRollDirectionChange}
                placeholder="Select roll direction"
                textColorClass="text-gray-700 dark:text-gray-300 text-sm"
              />
            </div>
          </div>
        )}
      </div>
      <div className="border-t border-gray-200 dark:border-gray-600 mt-1"></div>
    </div>
  );
};
