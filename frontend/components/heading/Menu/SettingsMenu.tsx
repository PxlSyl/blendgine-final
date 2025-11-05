import React, { useState, useEffect } from 'react';

import { useStore } from '@/components/store';
import { useKeyboardShortcuts } from '@/components/hooks/useKeyboardShortcuts';
import { api } from '@/services';

import MenuLayout from './Components/MenuLayout';
import MenuButton from './Components/MenuButton';
import SubMenu from './Components/SubMenu';
import { CheckIcon } from '@/components/icons';

interface SettingsMenuProps {
  disabled?: boolean;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onOpenThemeColorsWindow: () => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({
  disabled = false,
  isOpen,
  onOpen,
  onClose,
  onOpenThemeColorsWindow,
}) => {
  const [isThemeSubMenuOpen, setIsThemeSubMenuOpen] = useState(false);
  const [isSidebarSubMenuOpen, setIsSidebarSubMenuOpen] = useState(false);
  const [isTooltipsSubMenuOpen, setIsTooltipsSubMenuOpen] = useState(false);
  const [isRendererSubMenuOpen, setIsRendererSubMenuOpen] = useState(false);
  const [gpuAvailable, setGpuAvailable] = useState<boolean | null>(null);
  const {
    showTooltips,
    setShowTooltips,
    darkMode,
    setDarkMode,
    sidebarFull,
    setSidebarFull,
    renderer,
    setRenderer,
  } = useStore();

  useEffect(() => {
    const checkGpu = async () => {
      try {
        const result = await api.checkGpuAvailability();
        setGpuAvailable(result.available);

        if (!result.available && renderer === 'gpu') {
          console.warn('GPU not available, switching to CPU');
          await setRenderer('cpu');
        }
      } catch (error) {
        console.error('Failed to check GPU availability:', error);
        setGpuAvailable(false);

        if (renderer === 'gpu') {
          console.warn('Could not check GPU availability, switching to CPU');
          await setRenderer('cpu');
        }
      }
    };
    void checkGpu();
  }, [renderer, setRenderer]);

  const handleToggleTooltips = async () => {
    await setShowTooltips(!showTooltips);
    onClose();
  };

  const handleSetLightTheme = async () => {
    if (darkMode) {
      await setDarkMode(false);
    }
    onClose();
  };

  const handleSetDarkTheme = async () => {
    if (!darkMode) {
      await setDarkMode(true);
    }
    onClose();
  };

  const handleToggleTheme = async () => {
    await setDarkMode(!darkMode);
  };

  const handleSetCpuRenderer = async () => {
    if (renderer !== 'cpu') {
      await setRenderer('cpu');
    }
    onClose();
  };

  const handleSetGpuRenderer = async () => {
    if (gpuAvailable === false) {
      console.warn('Cannot switch to GPU: GPU not available');
      return;
    }

    if (renderer !== 'gpu') {
      await setRenderer('gpu');
    }
    onClose();
  };

  useKeyboardShortcuts({
    'shift+t': () => !disabled && void handleToggleTheme(),
    'shift+h': () => !disabled && void handleToggleTooltips(),
    'shift+f': () => !disabled && setSidebarFull(!sidebarFull),
    'shift+r': () =>
      !disabled &&
      (renderer === 'cpu' && gpuAvailable !== false
        ? void handleSetGpuRenderer()
        : void handleSetCpuRenderer()),
  });

  return (
    <MenuLayout
      label="Settings"
      isOpen={isOpen}
      setIsOpen={(open) => (open ? onOpen() : onClose())}
      disabled={disabled}
    >
      <SubMenu
        label="Theme"
        shortcut="Shift+T"
        isOpen={isThemeSubMenuOpen}
        onMouseEnter={() => setIsThemeSubMenuOpen(true)}
        onMouseLeave={() => setIsThemeSubMenuOpen(false)}
      >
        <MenuButton onClick={() => void handleSetLightTheme()}>
          <div className="flex items-center justify-between w-full">
            <span className="flex-1 text-left">Light</span>
            {!darkMode && (
              <CheckIcon className="w-4 h-4 text-[rgb(var(--color-accent))] flex-shrink-0" />
            )}
          </div>
        </MenuButton>
        <MenuButton onClick={() => void handleSetDarkTheme()}>
          <div className="flex items-center justify-between w-full">
            <span className="flex-1 text-left">Dark</span>
            {darkMode && (
              <CheckIcon className="w-4 h-4 text-[rgb(var(--color-accent))] flex-shrink-0" />
            )}
          </div>
        </MenuButton>
        <MenuButton onClick={onOpenThemeColorsWindow}>
          <div className="flex items-center justify-between w-full">
            <span className="flex-1 text-left">Colors</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4 text-gray-400"
            >
              <path d="M8.7 15.9L4.8 12l3.9-3.9c.39-.39.39-1.01 0-1.4-.39-.39-1.01-.39-1.4 0l-4.59 4.59c-.39.39-.39 1.02 0 1.41l4.59 4.6c.39.39 1.01.39 1.4 0 .39-.39.39-1.01 0-1.4zM15.3 8.1L19.2 12l-3.9 3.9c-.39.39-.39 1.01 0 1.4.39.39 1.01.39 1.4 0l4.59-4.59c.39-.39.39-1.02 0-1.41l-4.59-4.6c-.39-.39-1.01-.39-1.4 0-.39.39-.39 1.01 0 1.4z" />
            </svg>
          </div>
        </MenuButton>
      </SubMenu>
      <SubMenu
        label="Tooltips"
        shortcut="Shift+H"
        isOpen={isTooltipsSubMenuOpen}
        onMouseEnter={() => setIsTooltipsSubMenuOpen(true)}
        onMouseLeave={() => setIsTooltipsSubMenuOpen(false)}
      >
        <MenuButton onClick={() => void setShowTooltips(true)}>
          <div className="flex items-center justify-between w-full">
            <span className="flex-1 text-left">Yes</span>
            {showTooltips && (
              <CheckIcon className="w-4 h-4 text-[rgb(var(--color-accent))] flex-shrink-0" />
            )}
          </div>
        </MenuButton>
        <MenuButton onClick={() => void setShowTooltips(false)} isLast>
          <div className="flex items-center justify-between w-full">
            <span className="flex-1 text-left">No</span>
            {!showTooltips && (
              <CheckIcon className="w-4 h-4 text-[rgb(var(--color-accent))] flex-shrink-0" />
            )}
          </div>
        </MenuButton>
      </SubMenu>
      <SubMenu
        label="Sidebar"
        shortcut="Shift+F"
        isOpen={isSidebarSubMenuOpen}
        onMouseEnter={() => setIsSidebarSubMenuOpen(true)}
        onMouseLeave={() => setIsSidebarSubMenuOpen(false)}
      >
        <MenuButton onClick={() => setSidebarFull(true)}>
          <div className="flex items-center justify-between w-full">
            <span className="flex-1 text-left">Full</span>
            {sidebarFull && (
              <CheckIcon className="w-4 h-4 text-[rgb(var(--color-accent))] flex-shrink-0" />
            )}
          </div>
        </MenuButton>
        <MenuButton onClick={() => setSidebarFull(false)} isLast>
          <div className="flex items-center justify-between w-full">
            <span className="flex-1 text-left">Compact</span>
            {!sidebarFull && (
              <CheckIcon className="w-4 h-4 text-[rgb(var(--color-accent))] flex-shrink-0" />
            )}
          </div>
        </MenuButton>
      </SubMenu>
      <SubMenu
        label="Renderer"
        shortcut="Shift+R"
        isOpen={isRendererSubMenuOpen}
        onMouseEnter={() => setIsRendererSubMenuOpen(true)}
        onMouseLeave={() => setIsRendererSubMenuOpen(false)}
      >
        <MenuButton onClick={() => void handleSetCpuRenderer()}>
          <div className="flex items-center justify-between w-full">
            <span className="flex-1 text-left">CPU</span>
            {renderer === 'cpu' && (
              <CheckIcon className="w-4 h-4 text-[rgb(var(--color-accent))] flex-shrink-0" />
            )}
          </div>
        </MenuButton>
        <MenuButton
          onClick={() => void handleSetGpuRenderer()}
          isLast
          disabled={gpuAvailable === false}
        >
          <div className="flex items-center justify-between w-full">
            <span className={`flex-1 text-left ${gpuAvailable === false ? 'text-gray-400' : ''}`}>
              GPU
              {gpuAvailable === false && (
                <span className="ml-2 text-xs text-red-500">(Non disponible)</span>
              )}
            </span>
            {renderer === 'gpu' && gpuAvailable !== false && (
              <CheckIcon className="w-4 h-4 text-[rgb(var(--color-accent))] flex-shrink-0" />
            )}
          </div>
        </MenuButton>
      </SubMenu>
    </MenuLayout>
  );
};

export default SettingsMenu;
