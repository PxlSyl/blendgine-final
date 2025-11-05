import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InfoIcon } from '@/components/icons';
import { NumericInputWithButtons } from '@/components/shared/NumericInputWithButtons';
import Dropdown from '@/components/shared/Dropdown';
import CheckboxWithLabel from '@/components/shared/CheckboxWithLabel';
import type { WebMSettings, MP4Settings, WebPSettings, GIFSettings } from '@/types/effect';

type FormatType = 'webm' | 'mp4' | 'webp' | 'gif';

interface FormatSpecificSettings {
  webm: WebMSettings;
  mp4: MP4Settings;
  webp: WebPSettings;
  gif: GIFSettings;
}

const interpolationMethods = [
  'BIDIRECTIONAL',
  'BLEND',
  'BLOCK_BASED',
  'DISPLACEMENT_MAP',
  'DISSOLVE',
  'LUCAS_KANADE',
  'MOTION_FLOW',
  'PHASE_BASED',
] as const;

const formatMethodName = (method: string): string => {
  switch (method) {
    case 'LUCAS_KANADE':
      return 'Lucas Kanade';
    case 'MOTION_FLOW':
      return 'Motion Flow';
    case 'PHASE_BASED':
      return 'Phase Based';
    case 'BLOCK_BASED':
      return 'Block Based';
    case 'DISPLACEMENT_MAP':
      return 'Displacement Map';
    default:
      return method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();
  }
};

export const InterpolationControls: React.FC<{
  settings: FormatSpecificSettings[FormatType];
  onSettingChange: (key: string, value: boolean | string | number) => void;
}> = ({ settings, onSettingChange }) => {
  if (!settings?.interpolation) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <CheckboxWithLabel
          label="Enable Frame Interpolation"
          checked={settings.interpolation?.enabled || false}
          onChange={(checked) => onSettingChange('enabled', checked)}
        />
        <div className="text-sm italic flex items-center text-gray-500 dark:text-gray-400">
          <InfoIcon className="w-6 h-6 ml-4 mr-2 shrink-0" />
          <span className="flex-1">
            Interpolation creates additional frames between existing ones for smoother animation
          </span>
        </div>
      </div>

      <AnimatePresence>
        {settings.interpolation?.enabled && (
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
                label="Interpolation Factor"
                value={settings.interpolation?.factor?.toString() || '1'}
                onChange={(value) => onSettingChange('factor', parseInt(value))}
                min={1}
                max={10}
              />
              <div className="text-sm italic flex items-center text-gray-500 dark:text-gray-400">
                <InfoIcon className="w-6 h-6 mr-2 shrink-0" />
                <span className="flex-1">
                  Number of frames to insert between each existing frame (1-10)
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-999">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Interpolation Method
                </label>
                <Dropdown
                  options={[...interpolationMethods]}
                  value={settings.interpolation?.method || 'LUCAS_KANADE'}
                  onChange={(value) => onSettingChange('method', value)}
                  placeholder="Select interpolation method"
                  textColorClass="text-gray-500 dark:text-gray-400"
                  hoverBgClass="hover:bg-gray-50 dark:hover:bg-gray-600"
                  renderOption={(option) => formatMethodName(option)}
                  renderValue={(value) => formatMethodName(value)}
                />
              </div>
              <div className="text-sm italic flex items-center mt-4 text-gray-500 dark:text-gray-400">
                <InfoIcon className="w-6 h-6 mr-2 shrink-0" />
                <span className="flex-1">
                  {settings.interpolation?.method === 'LUCAS_KANADE'
                    ? 'Detects moving objects and follows their motion to create realistic animations. Best for scenes with multiple moving elements.'
                    : settings.interpolation?.method === 'MOTION_FLOW'
                      ? 'Advanced motion analysis that tracks pixel movement patterns. Excellent for complex animations with detailed motion.'
                      : settings.interpolation?.method === 'BLEND'
                        ? 'Crossfade interpolation that smoothly blends adjacent frames together. Creates gentle transitions and is ideal for simple animations with minimal movement.'
                        : settings.interpolation?.method === 'PHASE_BASED'
                          ? 'Uses advanced mathematical analysis for smooth transitions. Excellent for subtle movements and natural-looking results.'
                          : settings.interpolation?.method === 'BIDIRECTIONAL'
                            ? 'Analyzes movement in both directions for balanced interpolation. Great for complex movements and cyclic animations.'
                            : settings.interpolation?.method === 'DISSOLVE'
                              ? 'Creates pixel-based dissolution effects with noise patterns. Perfect for creative transitions and artistic effects.'
                              : settings.interpolation?.method === 'BLOCK_BASED'
                                ? 'Processes the image in blocks for unique visual effects. Can create mosaic-like transitions and is optimized for performance.'
                                : settings.interpolation?.method === 'DISPLACEMENT_MAP'
                                  ? 'Uses displacement mapping to morph between frames with geometric deformation. Creates organic, fluid transitions with natural warping effects.'
                                  : 'Select an interpolation method to see its description'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
