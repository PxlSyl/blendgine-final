import React from 'react';
import { ThemeName, getThemeDisplayName } from '@/types/themes';

interface ThemePreviewProps {
  themeName: ThemeName;
  isSelected: boolean;
  onClick: () => void;
}

const ThemePreview: React.FC<ThemePreviewProps> = ({ themeName, isSelected, onClick }) => {
  return (
    <div
      className={`flex items-center justify-between w-full p-2 rounded-sm cursor-pointer transition-colors ${
        isSelected ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
      onClick={onClick}
      data-theme={themeName}
    >
      <div className="flex items-center space-x-3">
        <div className="flex space-x-1">
          <div className="w-4 h-4 rounded-full bg-[rgb(var(--color-primary))]"></div>
          <div className="w-4 h-4 rounded-full bg-[rgb(var(--color-secondary))]"></div>
          <div className="w-4 h-4 rounded-full bg-[rgb(var(--color-accent))]"></div>
        </div>
        <span className="text-sm font-medium">{getThemeDisplayName(themeName)}</span>
      </div>
      {isSelected && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-4 h-4 text-[rgb(var(--color-accent))] flex-shrink-0"
        >
          <path d="M9.55 18l-5.7-5.7 1.425-1.425L9.55 15.15l9.175-9.175L20.15 7.4z" />
        </svg>
      )}
    </div>
  );
};

export default ThemePreview;
