import React from 'react';

import GradientBar from '@/components/shared/GradientBar';

interface WindowLayoutProps {
  children: React.ReactNode;
  onClose: () => void;
  containerClassName?: string;
  contentClassName?: string;
}

const WindowLayout: React.FC<WindowLayoutProps> = ({
  children,
  onClose,
  containerClassName = '',
  contentClassName = '',
}) => {
  return (
    <div className={`window-container ${containerClassName}`}>
      <GradientBar position="top" />
      <div
        className={`content-scrollable bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${contentClassName}`}
      >
        {children}
      </div>
      <div className="py-2 px-4 flex justify-end bg-white dark:bg-gray-800">
        <button
          onClick={onClose}
          className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-sm text-xs sm:text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer"
        >
          Close
        </button>
      </div>
      <div className="gradient-bar-fixed">
        <GradientBar position="bottom" />
      </div>
    </div>
  );
};

export default WindowLayout;
