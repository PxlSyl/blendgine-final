import React from 'react';
import { PictureIcon } from '@/components/icons/imageIcons';

interface EmptyPreviewPlaceholderProps {
  className?: string;
  title?: string;
  description?: string;
}

export const EmptyPreviewPlaceholder: React.FC<EmptyPreviewPlaceholderProps> = ({
  className = '',
  title = 'No Preview',
  description = 'Add effects to your pipeline and generate a preview to see the result',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 ${className}`}>
      <PictureIcon className="w-32 h-32 text-gray-300 dark:text-gray-600 mb-4" />
      <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">{title}</h3>
      <p className="text-gray-500 dark:text-gray-500 text-sm max-w-xs">{description}</p>
    </div>
  );
};

export default EmptyPreviewPlaceholder;
