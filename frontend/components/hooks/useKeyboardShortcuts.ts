import { useEffect } from 'react';

import { useIsProcessing } from './useIsProcessing';

interface KeyboardShortcuts {
  [shortcut: string]: () => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcuts) => {
  const isProcessing = useIsProcessing();

  useEffect(() => {
    if (isProcessing) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (event.ctrlKey && event.shiftKey) {
        const shortcutKey = `ctrl+shift+${key}`;

        if (shortcuts[shortcutKey]) {
          event.preventDefault();
          shortcuts[shortcutKey]();
        }
      } else if (event.ctrlKey) {
        const shortcutKey = `ctrl+${key}`;

        if (shortcuts[shortcutKey]) {
          event.preventDefault();
          shortcuts[shortcutKey]();
        }
      } else if (event.shiftKey) {
        const shortcutKey = `shift+${key}`;

        if (shortcuts[shortcutKey]) {
          event.preventDefault();
          shortcuts[shortcutKey]();
        }
      } else {
        if (shortcuts[key]) {
          if (
            document.activeElement instanceof HTMLInputElement ||
            document.activeElement instanceof HTMLTextAreaElement
          ) {
            event.preventDefault();
          }
          shortcuts[key]();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, isProcessing]);
};
