import React from 'react';
import { Effect } from 'effect';

import MenuLayout from './Components/MenuLayout';
import MenuButton from './Components/MenuButton';
import { useKeyboardShortcuts } from '@/components/hooks/useKeyboardShortcuts';
import { useShortcutsStore } from '@/components/windows/shortcuts/store';

interface HelpMenuProps {
  disabled?: boolean;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const HelpMenu: React.FC<HelpMenuProps> = ({ disabled = false, isOpen, onOpen, onClose }) => {
  const { openShortcutsWindow } = useShortcutsStore();

  const handleReadme = () => {
    onClose();
  };

  const handleShortcuts = () => {
    void openShortcutsWindow();
    onClose();
  };

  const handleDocumentation = () => {
    onClose();
  };

  const handleTutorial = () => {
    onClose();
  };

  const handleReleaseNotes = () => {
    onClose();
  };

  const handleTwitter = async () => {
    await Effect.runPromise(
      Effect.tryPromise({
        try: () => window.__TAURI__.shell.open('https://x.com/pxlsyllab'),
        catch: (error) => {
          console.error('Failed to open Twitter:', error);
          if (error instanceof Error) {
            console.error('Error details:', error.message);
          }
        },
      })
    );
    onClose();
  };

  const handleAbout = () => {
    onClose();
  };

  useKeyboardShortcuts({
    'shift+s': () => !disabled && handleShortcuts(),
  });

  return (
    <MenuLayout
      label="Help"
      isOpen={isOpen}
      setIsOpen={(open) => (open ? onOpen() : onClose())}
      disabled={disabled}
      position="left"
    >
      <MenuButton onClick={handleReadme}>
        <span>Readme</span>
      </MenuButton>
      <MenuButton onClick={handleShortcuts} shortcut="Shift+S">
        <span>Shortcuts</span>
      </MenuButton>
      <MenuButton onClick={handleDocumentation}>
        <span>Documentation</span>
      </MenuButton>
      <MenuButton onClick={handleTutorial}>
        <span>Tutorial</span>
      </MenuButton>
      <MenuButton onClick={handleReleaseNotes}>
        <span>Release notes</span>
      </MenuButton>
      <MenuButton onClick={() => void handleTwitter()}>
        <div className="flex items-center w-full">
          <svg className="w-4 h-4 mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span className="flex-1 text-left">Follow us on X</span>
        </div>
      </MenuButton>
      <MenuButton onClick={handleAbout} isLast>
        <span>About</span>
      </MenuButton>
    </MenuLayout>
  );
};

export default HelpMenu;
