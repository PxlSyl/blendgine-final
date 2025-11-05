import React from 'react';
import { BaseModal } from '../../../shared/modals/BaseModal';
import { ThemeName, themes } from '@/types/themes';
import { PaletteIcon } from '@/components/icons';

interface ThemeColorsModalProps {
  isOpen: boolean;
  onClose: () => void;
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

const ThemeColorsModal: React.FC<ThemeColorsModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onThemeSelect,
}) => {
  const handleThemeSelect = (themeName: ThemeName) => {
    onThemeSelect(themeName);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Choose theme colors"
      icon={<PaletteIcon className="w-4 sm:w-5 h-4 sm:h-5" />}
      iconColor="text-[rgb(var(--color-secondary))]"
      width="w-[400px]"
      height="h-[500px]"
      showFooter={true}
    >
      <div className="space-y-2">
        {Object.values(themes).map((theme) => (
          <div
            key={theme.name}
            className="flex items-center justify-between w-full p-3 rounded-sm cursor-pointer transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={() => handleThemeSelect(theme.name)}
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
    </BaseModal>
  );
};

export default ThemeColorsModal;
