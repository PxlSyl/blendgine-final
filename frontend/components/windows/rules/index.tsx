import React from 'react';

import { useRulesStore } from './store/main';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

const GlobalRulesWindow: React.FC = () => {
  const { openRulesWindow } = useRulesStore();

  const handleRulesShortcut = () => {
    void openRulesWindow();
  };

  useKeyboardShortcuts({
    'shift+r': handleRulesShortcut,
  });

  return null;
};

export default GlobalRulesWindow;
