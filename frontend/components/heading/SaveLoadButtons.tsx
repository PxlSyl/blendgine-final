import React from 'react';

import { useSaveLoadStore } from '@/components/store/saveLoad';
import { useProjectSetup } from '@/components/store/projectSetup/hook';

import { SaveIcon, LoadIcon } from '@/components/icons/SaveLoad';
import { Tooltip } from '@/components/shared/ToolTip';

const SaveLoadButtons: React.FC = () => {
  const { loadProjectConfig, saveProjectConfig } = useSaveLoadStore();
  const { hasSelectedFolder } = useProjectSetup();

  return (
    <div className="flex items-center space-x-2">
      <Tooltip tooltip="Load project">
        <div
          className={`rounded-sm overflow-hidden transition-all duration-200 bg-gradient-to-b from-[rgb(var(--color-primary-light))] to-[rgb(var(--color-primary))] dark:from-[rgb(var(--color-primary))] dark:to-[rgb(var(--color-primary-dark))] ${
            hasSelectedFolder ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
          style={{
            boxShadow:
              'inset 0 1px 0 0 rgba(255,255,255,0.4), inset 0 -2px 2px rgba(0,0,0,0.2), inset -2px 0 2px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.2)',
            border: '1px solid rgb(var(--color-primary))',
          }}
        >
          <button
            onClick={() => void loadProjectConfig()}
            disabled={hasSelectedFolder}
            className="text-white font-medium py-0.5 px-1 text-sm cursor-pointer"
            style={{
              textShadow: '0 -1px 0 rgba(0,0,0,0.2)',
            }}
          >
            <LoadIcon className="w-5 h-5" />
          </button>
        </div>
      </Tooltip>

      <Tooltip tooltip="Save project">
        <div
          className={`rounded-sm overflow-hidden transition-all duration-200 bg-gradient-to-b from-[rgb(var(--color-secondary-light))] to-[rgb(var(--color-secondary))] dark:from-[rgb(var(--color-secondary))] dark:to-[rgb(var(--color-secondary-dark))] ${
            hasSelectedFolder ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
          style={{
            boxShadow:
              'inset 0 1px 0 0 rgba(255,255,255,0.4), inset 0 -2px 2px rgba(0,0,0,0.2), inset -2px 0 2px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.2)',
            border: '1px solid rgb(var(--color-secondary))',
          }}
        >
          <button
            onClick={() => void saveProjectConfig()}
            disabled={hasSelectedFolder}
            className="text-white font-medium py-0.5 px-1 text-sm cursor-pointer"
            style={{
              textShadow: '0 -1px 0 rgba(0,0,0,0.2)',
            }}
          >
            <SaveIcon className="w-5 h-5" />
          </button>
        </div>
      </Tooltip>
    </div>
  );
};

export default SaveLoadButtons;
