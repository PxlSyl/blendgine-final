import React from 'react';
import { RestoreIcon } from '@/components/icons';
import { capitalize, formatBlendModeName } from '@/utils/functionsUtils';

export const TraitInfo: React.FC<{
  layer: string;
  traitName: string;
  currentBlendMode: string;
  onReset: () => void;
}> = ({ layer, traitName, currentBlendMode, onReset }) => (
  <div className="py-3 flex flex-col items-start w-full border-b border-gray-200 dark:border-gray-700 text-sm">
    <div className="w-full flex justify-between items-start">
      <div className="flex flex-col">
        <div className="flex flex-row">
          <span className="font-bold text-gray-600 dark:text-gray-300">Trait: </span>
          <span className="text-[rgb(var(--color-primary))] italic ml-1">{capitalize(layer)}</span>
        </div>
        <div className="flex flex-row mt-1">
          <span className="font-bold text-gray-600 dark:text-gray-300">Value: </span>
          <span className="text-[rgb(var(--color-secondary))] italic ml-1">
            {capitalize(traitName)}
          </span>
        </div>
        <div className="flex flex-row mt-1">
          <span className="font-bold text-gray-600 dark:text-gray-300">Current Blend Mode: </span>
          <span className="italic text-[rgb(var(--color-accent))] ml-1">
            {formatBlendModeName(currentBlendMode)}
          </span>
        </div>
      </div>

      <button
        onClick={onReset}
        className="px-2 py-1 rounded-sm bg-gray-100 dark:bg-gray-700 text-[rgb(var(--color-quaternary))] dark:text-[rgb(var(--color-quaternary-dark))] hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-1 cursor-pointer"
      >
        <RestoreIcon className="w-4 h-4" />
        <span>Reset</span>
      </button>
    </div>
  </div>
);
