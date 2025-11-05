import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import ShortcutsWindow from './components/windows/shortcuts/ShortcutsWindow';
import './index.css';
import './shortcuts.css';

const ShortcutsApp: React.FC = () => {
  useEffect(() => {
    const handleTauriResize = (event: CustomEvent<{ width: number; height: number }>) => {
      if (event.detail) {
        document.body.style.minHeight = '0';
        setTimeout(() => {
          document.body.style.minHeight = '';
        }, 0);
      }
    };

    window.addEventListener('tauri-window-resize', handleTauriResize as EventListener);

    return () => {
      window.removeEventListener('tauri-window-resize', handleTauriResize as EventListener);
    };
  }, []);

  return (
    <React.StrictMode>
      <ShortcutsWindow />
    </React.StrictMode>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<ShortcutsApp />);
}
