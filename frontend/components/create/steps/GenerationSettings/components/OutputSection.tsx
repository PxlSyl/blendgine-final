import React from 'react';
import { InfoIcon } from '@/components/icons';
import { FolderDisplay } from '@/components/shared/FolderDisplay';
import { useProjectSetup } from '@/components/store/projectSetup/hook';
import { useGenerationSettingsStore } from '@/components/store/generationsettings';

interface OutputSectionProps {
  exportFolder: string | null;
  handleSelectExportFolder: () => void;
}

export const OutputSection: React.FC<OutputSectionProps> = ({
  exportFolder,
  handleSelectExportFolder,
}) => {
  const { isAnimatedCollection } = useProjectSetup();
  const { baseWidth, baseHeight } = useGenerationSettingsStore();
  return (
    <div className="p-2 rounded-sm shadow-md mb-2 relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <div className="text-md font-semibold text-[rgb(var(--color-primary))]">Output</div>
          <div className="hidden sm:flex text-sm italic items-center text-gray-500 dark:text-gray-400">
            <InfoIcon className="w-5 h-5 mr-2" />
            Choose where to save your artworks
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleSelectExportFolder}
            className="w-full bg-gradient-to-r from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] 
              hover:from-[rgb(var(--color-primary-dark))] hover:to-[rgb(var(--color-secondary-dark))] 
              text-white font-medium px-4 h-10
              rounded-sm
              transition-colors duration-300 ease-in-out
              focus:outline-none
              flex items-center justify-center space-x-2"
            style={{
              boxShadow:
                'inset 0 1px 0 0 rgba(255,255,255,0.4), inset 0 -2px 2px rgba(0,0,0,0.2), inset -2px 0 2px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.2)',
              border: '1px solid rgb(var(--color-primary))',
              textShadow: '0 -1px 0 rgba(0,0,0,0.2)',
            }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            <span className="sm:text-base text-sm">Select Export Folder</span>
          </button>

          {exportFolder && (
            <div className="animate-fadeIn">
              <FolderDisplay label="Export folder" path={exportFolder} />
            </div>
          )}

          <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div>
              <span className="sm:text-sm text-xs font-medium text-gray-700 dark:text-gray-300">
                Mode:
              </span>
              <span className="px-3 py-1 rounded-sm text-sm font-medium bg-[rgb(var(--color-secondary)/0.1)] text-[rgb(var(--color-secondary))]">
                {isAnimatedCollection ? 'Animated Collection' : 'Static Collection'}
              </span>
            </div>
            <div className="hidden sm:flex py-1 text-sm text-gray-600 dark:text-gray-300">
              Base dimensions of your layers:{' '}
              <div className="bg-[rgb(var(--color-secondary)/0.1)] px-2 ml-1 rounded-sm">
                <span className="ml-2 text-[rgb(var(--color-secondary))] font-bold">
                  {baseWidth} x {baseHeight}
                </span>{' '}
                <span className="ml-2 font-bold">px</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
