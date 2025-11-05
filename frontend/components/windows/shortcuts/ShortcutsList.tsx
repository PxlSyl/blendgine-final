import React, { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { TauriApiService } from '@/services/tauri-api';

import { ProjectIcon, LayersIcon } from '@/components/icons/StepIcons';
import { ManageIcon, SettingsIcon, SpecialIcon, WindowIcon } from '@/components/icons';

const ShortcutsList: React.FC = () => {
  useEffect(() => {
    const initTheme = async () => {
      try {
        const darkMode = await TauriApiService.getInstance().getTheme();
        const colorTheme = await TauriApiService.getInstance().getColorTheme();
        document.documentElement.classList.toggle('dark', darkMode);
        document.documentElement.setAttribute('data-theme', colorTheme);
      } catch (error) {
        console.error('Error getting theme:', error);
      }
    };
    void initTheme();

    let cancelled = false;

    const unlistenPromise1 = listen('shortcuts-theme-init', (event: { payload: boolean }) => {
      if (!cancelled) {
        const isDark = event.payload;
        document.documentElement.classList.toggle('dark', isDark);
      }
    });

    const unlistenPromise2 = listen('color-theme-changed', (event: { payload: string }) => {
      if (!cancelled) {
        document.documentElement.setAttribute('data-theme', event.payload);
      }
    });

    return () => {
      cancelled = true;
      Promise.all([unlistenPromise1, unlistenPromise2])
        .then(([unlistenFn1, unlistenFn2]) => {
          if (!cancelled) {
            if (typeof unlistenFn1 === 'function') {
              unlistenFn1();
            }
            if (typeof unlistenFn2 === 'function') {
              unlistenFn2();
            }
          }
        })
        .catch(() => {
          // Silent fail for race conditions
        });
    };
  }, []);

  return (
    <div className="content-scrollable bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
      <div className="px-4 py-4 space-y-6">
        <div>
          <div className="flex items-center text-lg font-medium text-[rgb(var(--color-primary))] mb-2">
            <span>
              <ProjectIcon className="w-5 h-5 mr-2" />
            </span>
            Project Management
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-center">
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30">
                <span className="font-medium text-[rgb(var(--color-secondary))] px-2 text-xs sm:text-base">
                  Ctrl + P
                </span>
              </div>
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30 ml-0.5 flex-1">
                <span className="text-gray-600 dark:text-gray-400 px-2 text-xs sm:text-base">
                  Project setup
                </span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30">
                <span className="font-medium text-[rgb(var(--color-secondary))] px-2 text-xs sm:text-base">
                  Ctrl + O
                </span>
              </div>
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30 ml-0.5 flex-1">
                <span className="text-gray-600 dark:text-gray-400 px-2 text-xs sm:text-base">
                  Select folder
                </span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30">
                <span className="font-medium text-[rgb(var(--color-secondary))] px-2 text-xs sm:text-base">
                  Ctrl + R
                </span>
              </div>
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30 ml-0.5 flex-1">
                <span className="text-gray-600 dark:text-gray-400 px-2 text-xs sm:text-base">
                  Reload project
                </span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30">
                <span className="font-medium text-[rgb(var(--color-secondary))] px-2 text-xs sm:text-base">
                  Ctrl + S
                </span>
              </div>
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30 ml-0.5 flex-1">
                <span className="text-gray-600 dark:text-gray-400 px-2 text-xs sm:text-base">
                  Save project
                </span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30">
                <span className="font-medium text-[rgb(var(--color-secondary))] px-2 text-xs sm:text-base">
                  Ctrl + L
                </span>
              </div>
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30 ml-0.5 flex-1">
                <span className="text-gray-600 dark:text-gray-400 px-2 text-xs sm:text-base">
                  Load project
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center text-lg font-medium text-[rgb(var(--color-primary))] mb-2">
            <span>
              <LayersIcon className="w-5 h-5 mr-2" />
            </span>
            Layer Management
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-center">
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30">
                <span className="font-medium text-[rgb(var(--color-secondary))] px-2 text-xs sm:text-base">
                  Ctrl + 2
                </span>
              </div>
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30 ml-0.5 flex-1">
                <span className="text-gray-600 dark:text-gray-400 px-2 text-xs sm:text-base">
                  Switch to 2D View
                </span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30">
                <span className="font-medium text-[rgb(var(--color-secondary))] px-2 text-xs sm:text-base">
                  Ctrl + 3
                </span>
              </div>
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30 ml-0.5 flex-1">
                <span className="text-gray-600 dark:text-gray-400 px-2 text-xs sm:text-base">
                  Switch to 3D View
                </span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30">
                <span className="font-medium text-[rgb(var(--color-secondary))] px-2 text-xs sm:text-base">
                  Ctrl + T
                </span>
              </div>
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30 ml-0.5 flex-1">
                <span className="text-gray-600 dark:text-gray-400 px-2 text-xs sm:text-base">
                  Open Rarity Percentages
                </span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30">
                <span className="font-medium text-[rgb(var(--color-secondary))] px-2 text-xs sm:text-base">
                  Ctrl + C
                </span>
              </div>
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30 ml-0.5 flex-1">
                <span className="text-gray-600 dark:text-gray-400 px-2 text-xs sm:text-base">
                  Open Rarity Charts
                </span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30">
                <span className="font-medium text-[rgb(var(--color-secondary))] px-2 text-xs sm:text-base">
                  Shift + R
                </span>
              </div>
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30 ml-0.5 flex-1">
                <span className="text-gray-600 dark:text-gray-400 px-2 text-xs sm:text-base">
                  Open Layers Rules window
                </span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30">
                <span className="font-medium text-[rgb(var(--color-secondary))] px-2 text-xs sm:text-base">
                  Ctrl + G
                </span>
              </div>
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30 ml-0.5 flex-1">
                <span className="text-gray-600 dark:text-gray-400 px-2 text-xs sm:text-base">
                  Open Generation
                </span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30">
                <span className="font-medium text-[rgb(var(--color-secondary))] px-2 text-xs sm:text-base">
                  Shift + G
                </span>
              </div>
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30 ml-0.5 flex-1">
                <span className="text-gray-600 dark:text-gray-400 px-2 text-xs sm:text-base">
                  Generate preview
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center text-lg font-medium text-[rgb(var(--color-primary))] mb-2">
            <span>
              <ManageIcon className="w-5 h-5 mr-2" />
            </span>
            Collection Management
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-center">
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30">
                <span className="font-medium text-[rgb(var(--color-secondary))] px-2 text-xs sm:text-base">
                  Ctrl + V
                </span>
              </div>
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30 ml-0.5 flex-1">
                <span className="text-gray-600 dark:text-gray-400 px-2 text-xs sm:text-base">
                  View collection rarity
                </span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30">
                <span className="font-medium text-[rgb(var(--color-secondary))] px-2 text-xs sm:text-base">
                  Ctrl + J
                </span>
              </div>
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30 ml-0.5 flex-1">
                <span className="text-gray-600 dark:text-gray-400 px-2 text-xs sm:text-base">
                  Edit single json file
                </span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30">
                <span className="font-medium text-[rgb(var(--color-secondary))] px-2 text-xs sm:text-base">
                  Ctrl + B
                </span>
              </div>
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30 ml-0.5 flex-1">
                <span className="text-gray-600 dark:text-gray-400 px-2 text-xs sm:text-base">
                  Json bulk editing
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center text-lg font-medium text-[rgb(var(--color-primary))] mb-2">
            <span>
              <SpecialIcon className="w-5 h-5 mr-2" />
            </span>
            Special Features
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-center">
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30">
                <span className="font-medium text-[rgb(var(--color-secondary))] px-2 text-xs sm:text-base">
                  Ctrl + E
                </span>
              </div>
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30 ml-0.5 flex-1">
                <span className="text-gray-600 dark:text-gray-400 px-2 text-xs sm:text-base">
                  Open Effects
                </span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30">
                <span className="font-medium text-[rgb(var(--color-secondary))] px-2 text-xs sm:text-base">
                  Ctrl + D
                </span>
              </div>
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30 ml-0.5 flex-1">
                <span className="text-gray-600 dark:text-gray-400 px-2 text-xs sm:text-base">
                  Open Legendary
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center text-lg font-medium text-[rgb(var(--color-primary))] mb-2">
            <span>
              <WindowIcon className="w-5 h-5 mr-2" />
            </span>
            Windows
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-center">
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30">
                <span className="font-medium text-[rgb(var(--color-secondary))] px-2 text-xs sm:text-base">
                  Shift + I
                </span>
              </div>
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30 ml-0.5 flex-1">
                <span className="text-gray-600 dark:text-gray-400 px-2 text-xs sm:text-base">
                  Open Layers view Window
                </span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30">
                <span className="font-medium text-[rgb(var(--color-secondary))] px-2 text-xs sm:text-base">
                  Shift + S
                </span>
              </div>
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30 ml-0.5 flex-1">
                <span className="text-gray-600 dark:text-gray-400 px-2 text-xs sm:text-base">
                  Open Shortcuts Window
                </span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30">
                <span className="font-medium text-[rgb(var(--color-secondary))] px-2 text-xs sm:text-base">
                  Shift + A
                </span>
              </div>
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30 ml-0.5 flex-1">
                <span className="text-gray-600 dark:text-gray-400 px-2 text-xs sm:text-base">
                  Open Account Modal
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center text-lg font-medium text-[rgb(var(--color-primary))] mb-2">
            <span>
              <SettingsIcon className="w-5 h-5 mr-2" />
            </span>
            Settings
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-center">
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30">
                <span className="font-medium text-[rgb(var(--color-secondary))] px-2 text-xs sm:text-base">
                  Shift + T
                </span>
              </div>
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30 ml-0.5 flex-1">
                <span className="text-gray-600 dark:text-gray-400 px-2 text-xs sm:text-base">
                  Toggle Dark/Light Theme
                </span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30">
                <span className="font-medium text-[rgb(var(--color-secondary))] px-2 text-xs sm:text-base">
                  Shift + H
                </span>
              </div>
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-sm py-1 px-1 flex items-center backdrop-blur-sm border border-gray-300 dark:border-gray-600/30 ml-0.5 flex-1">
                <span className="text-gray-600 dark:text-gray-400 px-2 text-xs sm:text-base">
                  Toggle Tooltips
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsList;
