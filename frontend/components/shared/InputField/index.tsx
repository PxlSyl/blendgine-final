import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface InputFieldProps {
  label: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  min?: string;
  index: number;
  showContent: boolean;
}

const TRANSITION_VARIANTS = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 20, scale: 0.95 },
} as const;

export const InputField: React.FC<InputFieldProps> = React.memo(
  ({ label, value, onChange, type = 'text', placeholder, min, index, showContent }) => {
    const inputWrapperClasses = 'relative group';
    const gradientBgClass =
      'absolute inset-0 bg-gradient-to-r from-[rgb(var(--color-primary-light))]/75 to-[rgb(var(--color-secondary))]/75 rounded-sm blur-sm';
    const inputClasses = `text-md w-full px-2 py-2 rounded-sm relative
      bg-white dark:bg-gray-900 text-gray-900 dark:text-white
      placeholder-gray-400 focus:outline-none`;
    const labelClasses = `z-10 pr-2 absolute text-xs font-bold 
      text-gray-700 dark:text-gray-300
      left-0 -top-2.5 px-1 rounded-sm
      bg-white/75 dark:bg-gray-800/75`;

    return (
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={TRANSITION_VARIANTS}
            transition={{ duration: 0.2, ease: 'easeOut', delay: index * 0.15 }}
            className="relative"
          >
            <label className={labelClasses}>{label}</label>
            <div className={inputWrapperClasses}>
              <div className={gradientBgClass} />
              <input
                type={type}
                className={`${inputClasses}`}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                min={min}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);
InputField.displayName = 'InputField';
