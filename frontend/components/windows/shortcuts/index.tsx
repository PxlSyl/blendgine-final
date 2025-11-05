import React from 'react';

import { useShortcutsStore } from './store';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

const GlobalShortcutsWindow: React.FC = () => {
  const { openShortcutsWindow } = useShortcutsStore();

  const handleShortcutsShortcut = () => {
    void openShortcutsWindow();
  };

  useKeyboardShortcuts({
    'shift+s': handleShortcutsShortcut,
  });

  return null;
};

export default GlobalShortcutsWindow;
