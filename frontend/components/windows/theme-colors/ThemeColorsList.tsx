import React from 'react';
import { ThemeName, themes } from '@/types/themes';

interface ThemeColorsListProps {
  currentTheme: ThemeName;
  onThemeSelect: (themeName: ThemeName) => void;
}

const CheckIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-4 h-4 text-[rgb(var(--color-accent))] flex-shrink-0"
  >
    <path d="M9.55 18l-5.7-5.7 1.425-1.425L9.55 15.15l9.175-9.175L20.15 7.4z" />
  </svg>
);

const ThemeColorsList: React.FC<ThemeColorsListProps> = ({ currentTheme, onThemeSelect }) => {
  return (
    <div className="content-scrollable bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
      <div className="px-4 py-4 space-y-2">
        {Object.values(themes).map((theme) => (
          <div
            key={theme.name}
            className="flex items-center justify-between w-full p-3 rounded-sm cursor-pointer transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={() => onThemeSelect(theme.name)}
            data-theme={theme.name}
          >
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1">
                <div className="w-5 h-5 rounded-full bg-[rgb(var(--color-primary))]"></div>
                <div className="w-5 h-5 rounded-full bg-[rgb(var(--color-secondary))]"></div>
                <div className="w-5 h-5 rounded-full bg-[rgb(var(--color-accent))]"></div>
              </div>
              <span className="text-sm font-medium">{theme.displayName}</span>
            </div>
            {currentTheme === theme.name && CheckIcon}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThemeColorsList;
