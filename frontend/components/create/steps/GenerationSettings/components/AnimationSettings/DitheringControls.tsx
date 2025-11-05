import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NumericInputWithButtons } from '@/components/shared/NumericInputWithButtons';
import { InfoIcon } from '@/components/icons';
import Dropdown from '@/components/shared/Dropdown';
import CheckboxWithLabel from '@/components/shared/CheckboxWithLabel';

const ditheringMethods = ['NONE', 'FLOYDSTEINBERG', 'ORDERED', 'RASTERIZE'] as const;

interface DitheringControlsProps {
  settings: {
    dithering: boolean;
    ditheringMethod: (typeof ditheringMethods)[number];
    colors: number;
  };
  onDitheringChange: (checked: boolean) => void;
  onDitheringMethodChange: (value: string) => void;
  onColorsChange: (value: number) => void;
}

export const DitheringControls: React.FC<DitheringControlsProps> = ({
  settings,
  onDitheringChange,
  onDitheringMethodChange,
  onColorsChange,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <CheckboxWithLabel
          label="Enable Dithering"
          checked={settings.dithering}
          onChange={onDitheringChange}
        />
        <div className="text-sm italic flex items-center text-gray-500 dark:text-gray-400">
          <InfoIcon className="w-6 h-6 ml-4 mr-2 shrink-0" />
          <span className="flex-1">
            Dithering helps create smoother color transitions when reducing colors
          </span>
        </div>
      </div>

      <AnimatePresence>
        {settings.dithering && (
          <motion.div
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 ml-4"
          >
            <div className="space-y-4">
              <NumericInputWithButtons
                label="GIF Colors"
                value={settings.colors.toString()}
                onChange={(value) => onColorsChange(parseInt(value))}
                min={2}
                max={256}
              />
              <div className="text-sm italic flex items-center text-gray-500 dark:text-gray-400">
                <InfoIcon className="w-6 h-6 mr-2 shrink-0" />
                <span className="flex-1">
                  2-256 colors, lower means smaller file size but potential quality loss
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-999">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Dithering Method
                </label>
                <Dropdown
                  options={[...ditheringMethods]}
                  value={settings.ditheringMethod}
                  onChange={onDitheringMethodChange}
                  placeholder="Select dithering method"
                  textColorClass="text-gray-500 dark:text-gray-400"
                  hoverBgClass="hover:bg-gray-50 dark:hover:bg-gray-600"
                />
              </div>
              <div className="text-sm italic flex items-center mt-4 text-gray-500 dark:text-gray-400">
                <InfoIcon className="w-6 h-6 mr-2 shrink-0" />
                <span className="flex-1">
                  {settings.ditheringMethod === 'FLOYDSTEINBERG'
                    ? 'Advanced error-diffusion algorithm that produces high-quality results. Best for photographs and complex images with smooth gradients.'
                    : settings.ditheringMethod === 'ORDERED'
                      ? 'Creates a regular pattern of dots, giving a more structured and retro look. Good for stylized animations and when you want a consistent dithering pattern.'
                      : settings.ditheringMethod === 'RASTERIZE'
                        ? 'Simple threshold-based dithering that creates a basic dot pattern. Fast and memory-efficient, good for simple images or when you want a more pronounced dithering effect.'
                        : settings.ditheringMethod === 'NONE'
                          ? 'No dithering applied. Best for pixel art or images with sharp color transitions where you want to preserve exact colors.'
                          : 'FLOYDSTEINBERG: Best for photos, ORDERED/RASTERIZE: For artistic effects, NONE: For pixel art'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
