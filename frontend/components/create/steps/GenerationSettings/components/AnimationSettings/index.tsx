import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import type {
  GIFSettings,
  MP4Settings,
  WebMSettings,
  WebPSettings,
  AnimationQualityConfig,
} from '@/types/effect';

import { useGenerationSettingsStore } from '@/components/store/generationsettings';
import { useLayerOrder } from '@/components/store/layerOrder/hook';
import { useProjectSetup } from '@/components/store/projectSetup/hook';

import { NumericInputWithButtons } from '@/components/shared/NumericInputWithButtons';
import CheckboxWithLabel from '@/components/shared/CheckboxWithLabel';

import { InfoIcon } from '@/components/icons';
import { DitheringControls } from './DitheringControls';
import { InterpolationControls } from './InterpolationControls';

type FormatType = 'webm' | 'mp4' | 'webp' | 'gif';

export const AnimationSettings: React.FC<{
  transitionVariants: {
    hidden: { opacity: number; y: number };
    visible: { opacity: number; y: number };
    exit: { opacity: number; y: number };
  };
}> = ({ transitionVariants }) => {
  const { imageFormat, animationQuality, updateAnimationQuality } =
    useGenerationSettingsStore() as {
      imageFormat: string;
      animationQuality: AnimationQualityConfig | undefined;
      updateAnimationQuality: (updates: Partial<AnimationQualityConfig>) => void;
    };
  const { fps, setFPS } = useLayerOrder();
  const { isAnimatedCollection, maxFrames } = useProjectSetup();
  const [localDuration, setLocalDuration] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!fps || !maxFrames || !animationQuality) {
      setLocalDuration(undefined);
      return;
    }

    let totalFrames = maxFrames;
    const currentFormat = imageFormat as FormatType;
    const currentSettings = animationQuality?.formatSpecificSettings[currentFormat] as
      | WebMSettings
      | MP4Settings
      | WebPSettings
      | GIFSettings
      | undefined;

    if (currentSettings?.interpolation?.enabled) {
      totalFrames = Math.floor(totalFrames * (currentSettings.interpolation.factor || 1));
    }

    const duration = totalFrames / fps;
    setLocalDuration(duration);
  }, [fps, maxFrames, animationQuality, imageFormat]);

  const handleOptimizeChange = useCallback(
    (checked: boolean) => {
      updateAnimationQuality({ optimize: checked });
    },
    [updateAnimationQuality]
  );

  const handleFormatSpecificChange = useCallback(
    (
      format: FormatType,
      key: string,
      value: boolean | string | number | Record<string, unknown>
    ) => {
      const currentSettings = animationQuality?.formatSpecificSettings[format];
      if (currentSettings) {
        const updatedSettings = { ...currentSettings, [key]: value };
        updateAnimationQuality({
          formatSpecificSettings: {
            ...animationQuality.formatSpecificSettings,
            [format]: updatedSettings,
          },
        });
      }
    },
    [animationQuality, updateAnimationQuality]
  );

  const handleFormatSpecificInterpolationChange = (
    format: FormatType,
    key: string,
    value: boolean | string | number
  ) => {
    const currentSettings = animationQuality?.formatSpecificSettings[format];
    if (currentSettings?.interpolation) {
      const updatedInterpolation = {
        ...currentSettings.interpolation,
        [key]: value,
      };
      handleFormatSpecificChange(format, 'interpolation', updatedInterpolation);
    }
  };

  if (!isAnimatedCollection) {
    return null;
  }

  if (!animationQuality) {
    return null;
  }

  return (
    <motion.div
      key={`animation-settings-${imageFormat}`}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={transitionVariants}
      transition={{ duration: 0.1, ease: 'easeOut' }}
      className="p-2 rounded-sm shadow-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
    >
      <motion.h3 layout className="text-md font-semibold text-[rgb(var(--color-primary))] mb-4">
        Animation Settings
      </motion.h3>

      <motion.div layout className="space-y-4">
        <motion.div layout className="space-y-4">
          <NumericInputWithButtons
            label="Animation Speed (FPS)"
            value={fps?.toString() ?? '24'}
            onChange={(value) => setFPS(parseInt(value))}
            min={1}
            max={60}
          />
          <div className="text-sm italic flex items-center text-gray-500 dark:text-gray-400">
            <InfoIcon className="w-6 h-6 mr-2 shrink-0" />
            <span className="flex-1">
              Frames Per Second: Higher values create smoother animations but larger files. Common
              values: 24-30 for smooth animation, 12-15 for stylized motion.
            </span>
          </div>
        </motion.div>
        <div className="flex items-center mb-4">
          <CheckboxWithLabel
            label="Enable Autoloop"
            checked={
              animationQuality?.formatSpecificSettings[imageFormat as FormatType]?.autoloop ?? true
            }
            onChange={(checked) =>
              handleFormatSpecificChange(imageFormat as FormatType, 'autoloop', checked)
            }
          />
          <div className="text-sm italic flex items-center text-gray-500 dark:text-gray-400">
            <InfoIcon className="w-6 h-6 ml-4 mr-2 shrink-0" />
            <span className="flex-1">
              Enable/disable autoloop. If disabled, your first and last frame will not count for
              interpolation.
            </span>
          </div>
        </div>
        <AnimatePresence mode="wait">
          {(imageFormat === 'mp4' || imageFormat === 'webm') && (
            <motion.div
              key={`optimize-${imageFormat}`}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center">
                <CheckboxWithLabel
                  label="Optimize File Size"
                  checked={animationQuality?.optimize ?? false}
                  onChange={handleOptimizeChange}
                />
                <div className="text-sm italic flex items-center text-gray-500 dark:text-gray-400">
                  <InfoIcon className="w-6 h-6 ml-4 mr-2 shrink-0" />
                  <span className="flex-1">
                    {imageFormat === 'mp4'
                      ? 'Uses slower but better compression (slow preset)'
                      : 'Uses better compression quality (good deadline)'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {imageFormat === 'webm' && (
            <motion.div
              key="webm-quality"
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-1">
                <NumericInputWithButtons
                  label="WebM Quality"
                  value={animationQuality?.formatSpecificSettings.webm?.quality?.toString() ?? '7'}
                  onChange={(value) =>
                    handleFormatSpecificChange('webm', 'quality', parseInt(value))
                  }
                  min={1}
                  max={10}
                />
                <div className="text-sm italic flex items-center text-gray-500 dark:text-gray-400">
                  <InfoIcon className="w-6 h-6 mr-2 shrink-0" />
                  <span className="flex-1">1-10, lower is better.</span>
                </div>
              </div>
            </motion.div>
          )}

          {imageFormat === 'mp4' && (
            <motion.div
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-1">
                <NumericInputWithButtons
                  label="MP4 Quality"
                  value={animationQuality?.formatSpecificSettings.mp4?.quality?.toString() ?? '7'}
                  onChange={(value) =>
                    handleFormatSpecificChange('mp4', 'quality', parseInt(value))
                  }
                  min={1}
                  max={10}
                />
                <div className="text-sm italic flex items-center text-gray-500 dark:text-gray-400">
                  <InfoIcon className="w-6 h-6 mr-2 shrink-0" />
                  <span className="flex-1">1-10, lower is better.</span>
                </div>
              </div>
            </motion.div>
          )}

          {imageFormat === 'webp' && (
            <motion.div
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-6">
                <div className="flex items-center">
                  <CheckboxWithLabel
                    label="Enable Lossless Mode"
                    checked={animationQuality?.formatSpecificSettings.webp?.lossless ?? false}
                    onChange={(checked) => handleFormatSpecificChange('webp', 'lossless', checked)}
                  />
                  <div className="text-sm italic flex items-center text-gray-500 dark:text-gray-400">
                    <InfoIcon className="w-6 h-6 ml-4 mr-2 shrink-0" />
                    <span className="flex-1">
                      Preserves image quality without any loss of information.
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {!animationQuality?.formatSpecificSettings.webp?.lossless && (
                    <>
                      <NumericInputWithButtons
                        label="WebP Quality"
                        value={
                          animationQuality?.formatSpecificSettings.webp?.quality?.toString() ?? '80'
                        }
                        onChange={(value) =>
                          handleFormatSpecificChange('webp', 'quality', parseInt(value))
                        }
                        min={0}
                        max={100}
                      />
                      <div className="text-sm italic flex items-center text-gray-500 dark:text-gray-400">
                        <InfoIcon className="w-6 h-6 mr-2 shrink-0" />
                        <span className="flex-1">
                          In lossy mode, higher quality means better visual quality but larger file
                          size
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-4">
                  <NumericInputWithButtons
                    label="Compression Effort"
                    value={animationQuality?.formatSpecificSettings.webp?.method?.toString() ?? '4'}
                    onChange={(value) =>
                      handleFormatSpecificChange('webp', 'method', parseInt(value))
                    }
                    min={0}
                    max={6}
                  />
                  <div className="text-sm italic flex items-center text-gray-500 dark:text-gray-400">
                    <InfoIcon className="w-6 h-6 mr-2 shrink-0" />
                    <span className="flex-1">
                      Controls the compression effort: 0 is fastest, 6 gives the smallest file. size
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {imageFormat === 'gif' && (
            <motion.div
              key="gif-dithering"
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <DitheringControls
                settings={{
                  dithering: animationQuality?.formatSpecificSettings.gif?.dithering ?? false,
                  ditheringMethod:
                    animationQuality?.formatSpecificSettings.gif?.ditheringMethod ??
                    'FLOYDSTEINBERG',
                  colors: animationQuality?.formatSpecificSettings.gif?.colors ?? 256,
                }}
                onDitheringChange={(checked) =>
                  handleFormatSpecificChange('gif', 'dithering', checked)
                }
                onDitheringMethodChange={(value) =>
                  handleFormatSpecificChange('gif', 'ditheringMethod', value)
                }
                onColorsChange={(value) => handleFormatSpecificChange('gif', 'colors', value)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence mode="wait">
        {(['webm', 'mp4', 'webp', 'gif'] as const).includes(imageFormat as FormatType) && (
          <motion.div
            key={`interpolation-${imageFormat}`}
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-6"
          >
            <InterpolationControls
              settings={animationQuality?.formatSpecificSettings[imageFormat as FormatType]}
              onSettingChange={(key, value) =>
                handleFormatSpecificInterpolationChange(imageFormat as FormatType, key, value)
              }
            />
          </motion.div>
        )}
      </AnimatePresence>

      {localDuration !== undefined && (
        <motion.div layout className="mt-6 p-4 rounded-md bg-gray-100/50 dark:bg-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <span className="px-3 py-1 rounded-sm text-sm font-medium bg-[rgb(var(--color-secondary)/0.1)] text-[rgb(var(--color-secondary))]">
              Total Duration
            </span>
            <div className="font-mono text-lg font-bold text-[rgb(var(--color-secondary))] dark:text-[rgb(var(--color-secondary-dark))]">
              {localDuration.toFixed(3)}
              <span className="ml-1 text-gray-700 dark:text-gray-300">Seconds</span>
            </div>
          </div>
          <div className="text-sm italic flex items-center text-gray-500 dark:text-gray-400">
            <InfoIcon className="w-6 h-6 mr-2 shrink-0" />
            <span className="flex-1">
              Estimated duration for each animation in your collection.
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AnimationSettings;
