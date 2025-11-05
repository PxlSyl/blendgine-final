import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import { MoonIcon, SunIcon } from '@/components/icons';
import { useStore } from '@/components/store';

const DarkModeToggle: React.FC = () => {
  const { darkMode, setDarkMode } = useStore();
  const [isReady, setIsReady] = useState(false);

  const toggleContainerClasses =
    'flex items-center justify-start w-16 h-4 rounded-full p-1 cursor-pointer bg-[rgb(var(--color-primary))]/30 dark:bg-[rgb(var(--color-primary))]/70';
  const toggleButtonClasses =
    'flex items-center justify-center w-6 h-6 rounded-full bg-white shadow-md border border-[rgb(var(--color-secondary))]/30 dark:border-[rgb(var(--color-primary))]/30';

  useEffect(() => {
    const checkCSSVariables = () => {
      const primary = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-primary')
        .trim();
      const secondary = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-secondary')
        .trim();

      if (primary && secondary) {
        setIsReady(true);
      } else {
        setTimeout(checkCSSVariables, 50);
      }
    };

    checkCSSVariables();
  }, []);

  const getCSSVariable = (variable: string) => {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  };

  return (
    <>
      {isReady && (
        <motion.div
          className={toggleContainerClasses}
          onClick={() => void setDarkMode(!darkMode)}
          animate={{
            backgroundColor: darkMode
              ? `rgb(${getCSSVariable('--color-primary')})`
              : `rgb(${getCSSVariable('--color-secondary')})`,
          }}
        >
          <motion.div
            className={toggleButtonClasses}
            animate={{
              x: darkMode ? '135%' : '0%',
            }}
            transition={{ type: 'spring', stiffness: 700, damping: 30 }}
          >
            {darkMode ? (
              <MoonIcon className="w-4 h-4 text-[rgb(var(--color-primary))]" />
            ) : (
              <SunIcon className="w-4 h-4 text-[rgb(var(--color-secondary))]" />
            )}
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default DarkModeToggle;
