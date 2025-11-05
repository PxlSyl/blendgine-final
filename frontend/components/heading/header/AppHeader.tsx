import React from 'react';

import DarkModeToggle from '@/components/shared/DarkModeToggle';
import Menu from '@/components/heading/Menu';

const AppHeader: React.FC = () => {
  return (
    <header className="flex justify-between px-2 py-0.5">
      <div className="flex items-center">
        <div className="text-2xl font-bold tracking-wide font-title text-transparent bg-clip-text bg-gradient-to-r from-[rgb(var(--color-primary-light))] to-[rgb(var(--color-secondary))] mr-2">
          Blendgine
        </div>
        <div className="text-xs text-[rgb(var(--color-accent))] font-medium mr-4">V.1.0</div>
        <Menu />
      </div>

      <div className="flex items-center">
        <div className="text-lg font-medium text-gray-600 dark:text-gray-400 mr-2 hidden sm:block">
          By
        </div>
        <div className="text-xl font-bold font-title text-transparent bg-clip-text bg-gradient-to-r from-[rgb(var(--color-primary))] via-[rgb(var(--color-secondary))] to-[rgb(var(--color-accent))] mr-4 hidden sm:block">
          PxlSylLab
        </div>
        <DarkModeToggle />
      </div>
    </header>
  );
};

export default AppHeader;
