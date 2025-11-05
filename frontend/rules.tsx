import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import RulesWindow from './components/windows/rules/RulesWindow';
import './index.css';
import './rules.css';

const RulesApp: React.FC = () => {
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
      <RulesWindow />
    </React.StrictMode>
  );
};

const rulesRootElement = document.getElementById('rules-root');
if (rulesRootElement) {
  ReactDOM.createRoot(rulesRootElement).render(<RulesApp />);
}
