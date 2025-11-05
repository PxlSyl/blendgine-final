import React from 'react';

interface LoadingStateProps {
  imageName: string;
}

interface ImageLabelProps {
  imageName: string;
}

export const EmptyState: React.FC = React.memo(() => (
  <div className="h-full flex items-center justify-center">
    <p className="sm:text-lg text-base text-gray-500 dark:text-gray-400">No folder selected</p>
  </div>
));
EmptyState.displayName = 'EmptyState';

export const LoadingState: React.FC<LoadingStateProps> = React.memo(({ imageName }) => (
  <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
    <span className="sm:text-xs text-[10px] text-center break-words p-2">{imageName}</span>
  </div>
));
LoadingState.displayName = 'LoadingState';

export const ImageLabel: React.FC<ImageLabelProps> = React.memo(({ imageName }) => (
  <div className="absolute bottom-0 right-0 left-0 bg-[rgb(var(--color-primary)/0.5)] text-white sm:text-xs text-[10px] p-1 text-center truncate">
    {imageName}
  </div>
));
ImageLabel.displayName = 'ImageLabel';
