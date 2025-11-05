import React from 'react';
import { motion, Variants } from 'framer-motion';
import { useProjectSetup } from '@/components/store/projectSetup/hook';
import NumericStepper from '@/components/shared/NumericStepper';
import RegularSlider from '@/components/shared/RegularSlider';

interface ImageDimensionsProps {
  finalWidth: number;
  finalHeight: number;
  fixedProportion: boolean;
  MIN_IMAGE_SIZE: number;
  MAX_IMAGE_SIZE: number;
  handleWidthChange: (value: number) => void;
  handleHeightChange: (value: number) => void;
  setFixedProportion: (value: boolean) => void;
  getSliderPercentage: (value: number) => number;
  transitionVariants: Variants;
}

export const ImageDimensions: React.FC<ImageDimensionsProps> = ({
  finalWidth,
  finalHeight,
  fixedProportion,
  MIN_IMAGE_SIZE,
  MAX_IMAGE_SIZE,
  handleWidthChange,
  handleHeightChange,
  setFixedProportion,
  getSliderPercentage,
  transitionVariants,
}) => {
  const { isAnimatedCollection } = useProjectSetup();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={transitionVariants}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="space-y-2 lg:col-span-2 p-2 rounded-sm shadow-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex flex-col">
            <label className="text-md font-semibold text-[rgb(var(--color-primary))]">
              {isAnimatedCollection ? 'Animation Dimensions' : 'Image Dimensions'}
            </label>
          </div>
          <label className="flex items-center cursor-pointer group">
            <div className="flex items-center px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600">
              <span className="font-bold mr-3 text-gray-700 dark:text-gray-300 group-hover:text-[rgb(var(--color-secondary))]">
                Keep Proportions?
              </span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={fixedProportion}
                  onChange={() => setFixedProportion(!fixedProportion)}
                  className="sr-only peer"
                />
                <div className="w-5 h-5 border-2 rounded-md peer-focus:ring-2 peer-focus:ring-[rgb(var(--color-secondary)/0.5)] border-gray-300 dark:border-gray-600 peer-checked:border-[rgb(var(--color-secondary))] peer-checked:bg-[rgb(var(--color-secondary))]">
                  <svg
                    className={`w-3 h-3 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200 ease-in-out ${
                      fixedProportion ? 'opacity-100' : 'opacity-0'
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="white"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium w-16 text-gray-700 dark:text-gray-300">Width</span>
            <div className="grow">
              <RegularSlider
                value={finalWidth || MIN_IMAGE_SIZE}
                onChange={handleWidthChange}
                min={MIN_IMAGE_SIZE}
                max={MAX_IMAGE_SIZE}
                activeColor="rgb(var(--color-secondary))"
                className="range-slider"
                percentage={getSliderPercentage(finalWidth)}
              />
            </div>
            <div className="w-40">
              <NumericStepper
                value={finalWidth || MIN_IMAGE_SIZE}
                onChange={handleWidthChange}
                min={MIN_IMAGE_SIZE}
                max={MAX_IMAGE_SIZE}
                label="Px"
                labelClassName="text-xs font-bold sm:text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium w-16 text-gray-700 dark:text-gray-300">
              Height
            </span>
            <div className="grow">
              <RegularSlider
                value={finalHeight || MIN_IMAGE_SIZE}
                onChange={handleHeightChange}
                min={MIN_IMAGE_SIZE}
                max={MAX_IMAGE_SIZE}
                activeColor="rgb(var(--color-secondary))"
                className="range-slider"
                percentage={getSliderPercentage(finalHeight)}
              />
            </div>
            <div className="w-40">
              <NumericStepper
                value={finalHeight || MIN_IMAGE_SIZE}
                onChange={handleHeightChange}
                min={MIN_IMAGE_SIZE}
                max={MAX_IMAGE_SIZE}
                label="Px"
                labelClassName="text-xs font-bold sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
