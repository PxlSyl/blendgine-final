import React, { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { OffsetSlider } from './OffsetSlider';
import { useOffsetWindow } from './hooks/useOffsetWindow';
import { api } from '@/services';

const OffsetWindow: React.FC = () => {
  useEffect(() => {
    const initTheme = async () => {
      try {
        const darkMode = await api.getTheme();
        const colorTheme = await api.getColorTheme();
        document.documentElement.classList.toggle('dark', darkMode);
        document.documentElement.setAttribute('data-theme', colorTheme);
      } catch (error) {
        console.error('Error getting theme:', error);
      }
    };
    void initTheme();

    let cancelled = false;

    const unlistenPromise = listen('color-theme-changed', (event: { payload: string }) => {
      if (!cancelled) {
        document.documentElement.setAttribute('data-theme', event.payload);
      }
    });

    return () => {
      cancelled = true;
      unlistenPromise
        .then((unlistenFn) => {
          if (!cancelled && typeof unlistenFn === 'function') {
            unlistenFn();
          }
        })
        .catch(() => {
          // Silent fail
        });
    };
  }, []);

  const { layer, trait, offsetX, offsetY, handleOffsetXChange, handleOffsetYChange, handleReset } =
    useOffsetWindow();

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-md mx-auto flex flex-col gap-6">
          {/* Trait Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Layer:{' '}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {layer || 'Loading...'}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Trait:{' '}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {trait || 'Loading...'}
                </span>
              </div>
            </div>
          </div>
          <OffsetSlider
            label="Offset X"
            value={offsetX}
            min={-1000}
            max={1000}
            step={1}
            onChange={handleOffsetXChange}
          />

          <OffsetSlider
            label="Offset Y"
            value={offsetY}
            min={-1000}
            max={1000}
            step={1}
            onChange={handleOffsetYChange}
          />

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="cursor-pointer w-full px-4 py-2.5 text-sm font-medium text-white bg-[rgb(var(--color-primary))] rounded-md hover:bg-[rgb(var(--color-primary-dark))] transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default OffsetWindow;
