import React from 'react';

import { useShortcutsStore } from '@/components/windows/shortcuts/store';

import WindowLayout from '@/components/shared/WindowLayout';
import ShortcutsList from '@/components/windows/shortcuts/ShortcutsList';

const ShortcutsWindow: React.FC = () => {
  const closeShortcutsWindow = useShortcutsStore((state) => state.closeShortcutsWindow);

  return (
    <WindowLayout
      onClose={() => void closeShortcutsWindow()}
      containerClassName="shortcuts-window-container"
    >
      <ShortcutsList />
    </WindowLayout>
  );
};

export default ShortcutsWindow;
