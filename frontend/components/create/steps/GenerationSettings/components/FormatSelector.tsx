import React, { useEffect, useMemo } from 'react';
import { motion, Variants } from 'framer-motion';
import { useGenerationSettingsStore } from '@/components/store/generationsettings';
import { useProjectSetup } from '@/components/store/projectSetup/hook';
import Dropdown from '@/components/shared/Dropdown';

interface FormatSelectorProps {
  transitionVariants: Variants;
}

export const FormatSelector: React.FC<FormatSelectorProps> = ({ transitionVariants }) => {
  const { selectedFormat, setImageFormat } = useGenerationSettingsStore();
  const { isAnimatedCollection } = useProjectSetup();

  const availableFormats = useMemo(() => {
    return isAnimatedCollection ? ['mp4', 'webp', 'webm', 'gif'] : ['png', 'jpg', 'webp'];
  }, [isAnimatedCollection]);

  useEffect(() => {
    if (selectedFormat && !availableFormats.includes(selectedFormat)) {
      const defaultFormat = isAnimatedCollection ? 'gif' : 'png';

      void setImageFormat(defaultFormat);
    }
  }, [isAnimatedCollection, selectedFormat, availableFormats, setImageFormat]);

  const handleFormatChange = (format: string) => {
    const newFormat = format.toLowerCase();
    if (availableFormats.includes(newFormat)) {
      void setImageFormat(newFormat);
    }
  };

  const formatLabel = (format: string) => format.toUpperCase();

  const FormatOption = ({ format }: { format: string }) => (
    <div className="flex items-center">
      <span>{formatLabel(format)}</span>
    </div>
  );

  const currentFormat = useMemo(() => {
    if (selectedFormat && availableFormats.includes(selectedFormat)) {
      return selectedFormat;
    }
    return isAnimatedCollection ? 'gif' : 'png';
  }, [selectedFormat, availableFormats, isAnimatedCollection]);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={transitionVariants}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="p-2 rounded-sm shadow-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
    >
      <label className="block text-md font-semibold text-[rgb(var(--color-primary))] mb-2">
        Select {isAnimatedCollection ? 'Animation' : 'Image'} Format
      </label>
      <div className="relative">
        <Dropdown
          options={availableFormats}
          value={currentFormat}
          onChange={handleFormatChange}
          placeholder={isAnimatedCollection ? 'GIF' : 'PNG'}
          textColorClass="text-gray-500 dark:text-gray-400"
          hoverBgClass="hover:bg-gray-50 dark:hover:bg-gray-600"
          renderOption={(option) => <FormatOption format={option} />}
          renderValue={(value) => <FormatOption format={value} />}
        />
      </div>
    </motion.div>
  );
};
