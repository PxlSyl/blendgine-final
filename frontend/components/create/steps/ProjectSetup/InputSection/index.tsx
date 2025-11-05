import React from 'react';
import { motion } from 'framer-motion';

import { useProjectSetup } from '@/components/store/projectSetup/hook';
import { useProjectReload } from '../hooks/useProjectReload';

import { InfoIcon, RefreshIcon } from '@/components/icons';
import { FolderDisplay } from '@/components/shared/FolderDisplay';
import { Tooltip } from '@/components/shared/ToolTip';
import AnimatedProgress from './AnimatedProgress';

interface InputSectionProps {
  selectedFolder: string | null;
  isLoading?: boolean;
  progress?: number;
  status?: string;
}

const InputSection: React.FC<InputSectionProps> = ({ isLoading, progress = 0, status = '' }) => {
  const { isAnimatedCollection, selectedFolder, handleSelectFolder } = useProjectSetup();
  const handleReload = useProjectReload();

  return (
    <motion.div className="p-2 rounded-sm shadow-md mb-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <div className="text-md sm:text-lg font-semibold text-[rgb(var(--color-primary))]">
            Input
          </div>
          <div className="hidden sm:flex text-sm italic items-center text-gray-500 dark:text-gray-400">
            <InfoIcon className="w-5 h-5 mr-2" />
            Choose your layers folder
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => void handleSelectFolder()}
            className={`
              w-full bg-gradient-to-r from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] 
              hover:from-[rgb(var(--color-primary-dark))] hover:to-[rgb(var(--color-secondary-dark))] 
              text-white font-medium px-4 h-10
              rounded-sm
              transition-colors duration-300 ease-in-out
              focus:outline-none 
              flex items-center justify-center space-x-2
              ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
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
            <span className="sm:text-base text-sm">Select Layers Folder</span>
          </button>

          {selectedFolder && (
            <div className="animate-fadeIn">
              <FolderDisplay label="Layers folder" path={selectedFolder} />
            </div>
          )}

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            {isLoading ? (
              <AnimatedProgress
                progress={progress}
                status={status}
                isAnimated={isAnimatedCollection}
              />
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="sm:text-sm text-xs font-medium text-gray-700 dark:text-gray-300">
                    Mode:
                  </span>
                  {selectedFolder ? (
                    <span className="px-2 h-8 flex items-center rounded-sm sm:text-sm text-xs font-medium bg-[rgb(var(--color-secondary)/0.1)] text-[rgb(var(--color-secondary))]">
                      {isAnimatedCollection ? (
                        <>
                          Animated<span className="hidden sm:inline">&nbsp;Collection</span>
                        </>
                      ) : (
                        <>
                          Static<span className="hidden sm:inline">&nbsp;Collection</span>
                        </>
                      )}
                    </span>
                  ) : (
                    <span className="sm:text-sm text-xs text-gray-400 dark:text-gray-500">
                      No folder selected
                    </span>
                  )}
                </div>

                <Tooltip tooltip="Reload and reinitialize settings">
                  <button
                    onClick={() => void handleReload()}
                    disabled={!selectedFolder}
                    className={`flex items-center px-2 h-8 rounded-sm focus:outline-none
                      ${
                        selectedFolder
                          ? 'bg-gradient-to-b from-[rgb(var(--color-secondary))] to-[rgb(var(--color-secondary-dark))] text-white cursor-pointer'
                          : 'bg-gradient-to-b from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 text-gray-500 cursor-not-allowed'
                      }`}
                    style={
                      selectedFolder
                        ? {
                            boxShadow:
                              'inset 0 1px 0 0 rgba(255,255,255,0.4), inset 0 -2px 2px rgba(0,0,0,0.2), inset -2px 0 2px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.2)',
                            border: '1px solid rgb(var(--color-secondary))',
                            textShadow: '0 -1px 0 rgba(0,0,0,0.2)',
                          }
                        : {
                            boxShadow:
                              'inset 0 1px 0 0 rgba(255,255,255,0.2), inset 0 -1px 1px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.1)',
                            border: '1px solid rgba(150, 150, 150, 0.5)',
                          }
                    }
                  >
                    <RefreshIcon className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline sm:text-base text-sm">Reload</span>
                  </button>
                </Tooltip>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default InputSection;
