import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface CustomTooltipProps {
  show: boolean;
  text: string;
  containerRef: React.RefObject<HTMLElement | null>;
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({ show, text, containerRef }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (containerRef.current && show) {
      const rect = containerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top + rect.height / 2,
        left: rect.left - 8,
      });
    }
  }, [show, containerRef]);

  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            right: `calc(100% - ${position.left}px)`,
            transform: 'translateY(-50%)',
          }}
          className="z-[99999999] px-2 py-1 text-xs rounded-md whitespace-nowrap pointer-events-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-lg"
        >
          {text}
          <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 rotate-45 w-2 h-2 bg-white dark:bg-gray-800 border-t border-r border-gray-200 dark:border-gray-700" />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
