import React from 'react';

import { FolderIcon } from '../../icons';

interface FolderDisplayProps {
  label: string;
  path: string;
}

export const FolderDisplay: React.FC<FolderDisplayProps> = React.memo(({ label, path }) => (
  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">
    <span className="font-bold text-[rgb(var(--color-secondary))]">
      <FolderIcon className="w-4 sm:w-6 h-4 sm:h-6 inline-block mb-1 mr-1" /> {label}:
    </span>{' '}
    {path}
  </p>
));
FolderDisplay.displayName = 'FolderDisplay';
