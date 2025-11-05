import React from 'react';
import { motion, Variants } from 'framer-motion';
import Toggle from '@/components/shared/Toggle';

interface GenerationOptionsProps {
  shuffleSets: boolean;
  allowDuplicates: boolean;
  setShuffleSets: (value: boolean) => void;
  setAllowDuplicates: (value: boolean) => void;
  transitionVariants: Variants;
}

export const GenerationOptions: React.FC<GenerationOptionsProps> = ({
  shuffleSets,
  allowDuplicates,
  setShuffleSets,
  setAllowDuplicates,
  transitionVariants,
}) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={transitionVariants}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.4 }}
      className="flex flex-col space-y-2 p-2 rounded-sm shadow-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
    >
      <label className="block text-md font-semibold text-[rgb(var(--color-primary))] mb-2">
        Options
      </label>
      <div className="flex items-center">
        <Toggle
          checked={shuffleSets}
          onChange={() => setShuffleSets(!shuffleSets)}
          size="md"
          activeColor="bg-[rgb(var(--color-secondary))]"
          inactiveColor="bg-gray-300 dark:bg-gray-600"
          thumbColor="bg-[rgb(var(--color-primary))]"
        />
        <span className="ml-3 font-bold text-gray-700 dark:text-gray-300">Shuffle Sets</span>
      </div>
      <div className="flex items-center">
        <Toggle
          checked={allowDuplicates}
          onChange={() => setAllowDuplicates(!allowDuplicates)}
          size="md"
          activeColor="bg-[rgb(var(--color-secondary))]"
          inactiveColor="bg-gray-300 dark:bg-gray-600"
          thumbColor="bg-[rgb(var(--color-primary))]"
        />
        <span className="ml-3 font-bold text-gray-700 dark:text-gray-300">Allow Duplicates</span>
      </div>
    </motion.div>
  );
};
