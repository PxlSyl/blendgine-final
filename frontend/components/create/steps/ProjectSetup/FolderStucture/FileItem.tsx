import React, { memo, useState, useEffect } from 'react';
import { PencilIcon, ZoomIcon } from '@/components/icons';
import { useImagePreview } from '@/components/hooks/useImagePreview';
import { Tooltip } from '@/components/shared/ToolTip';
import type { BlendProperties } from '@/types/effect';
import { removeFileExtension } from '@/utils/functionsUtils';
import ImageTypeIcon from '@/components/shared/ImageTypeIcon';
import { useColorStore } from '@/components/store/randomUI';
import { useStore } from '@/components/store';

export interface LoadedImage {
  src: string | null;
  originalSrc?: string | null;
  blend: BlendProperties;
  blendedResult?: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

export const FileItem = memo<{
  layerName: string;
  originalImageName: string;
  editingFileName: string | null;

  onEdit: (fileName: string) => void;
  onSubmit: (oldFileName: string, newFileName?: string) => void;
  onKeyDown: (
    e: React.KeyboardEvent<HTMLInputElement>,
    oldFileName: string,
    newFileName?: string
  ) => void;
  loadedImages: Record<string, LoadedImage>;
  imageInfos?: ReadonlyArray<{
    readonly name: string;
    readonly frame_count?: number;
    readonly is_single_frame?: boolean;
  }>;
}>(
  ({
    layerName,
    originalImageName,
    editingFileName,

    onEdit,
    onSubmit,
    onKeyDown,
    loadedImages,
    imageInfos,
  }) => {
    const { getColorForKey: storeGetColorForKey } = useColorStore();
    const { themeName } = useStore();
    const [iconColor, setIconColor] = useState('#000000');

    useEffect(() => {
      const color = storeGetColorForKey(`${layerName}-${originalImageName}`);
      setIconColor(color);
    }, [layerName, originalImageName, storeGetColorForKey, themeName]);

    const [editValue, setEditValue] = useState(removeFileExtension(originalImageName));
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isEditing = editingFileName === originalImageName;

    useEffect(() => {
      setEditValue(removeFileExtension(originalImageName));
    }, [originalImageName]);

    useEffect(() => {
      if (isEditing) {
        setEditValue(removeFileExtension(originalImageName));
      }
    }, [isEditing, originalImageName]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditValue(e.target.value);
    };

    const handleSubmit = () => {
      if (isSubmitting) {
        return;
      }

      setIsSubmitting(true);
      try {
        onSubmit(originalImageName, editValue);
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        setEditValue(removeFileExtension(originalImageName));
        onEdit('');
      } else if (e.key === 'Enter' && !isSubmitting) {
        void handleSubmit();
      } else {
        onKeyDown(e, originalImageName, editValue);
      }
    };

    const key = `${layerName}/${originalImageName}`;
    const imageSrc = loadedImages[key]?.src;

    const { openDisplay } = useImagePreview({
      layerName,
      imageName: originalImageName,
      loadedImages: { [key]: { src: imageSrc } },
    });

    return (
      <li className="relative flex items-center pl-4 group hover:bg-gray-200 dark:hover:bg-gray-700 rounded-sm">
        <span className="absolute -left-px top-1/2 transform -translate-y-1/2 w-3 h-px bg-gray-300 dark:bg-gray-600" />
        <ImageTypeIcon
          imageInfos={imageInfos}
          itemName={originalImageName}
          className="w-4 h-4 mr-2"
          style={{ color: iconColor }}
        />
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={handleChange}
            onBlur={() => void handleSubmit()}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting}
            className={`bg-transparent border-b border-[rgb(var(--color-secondary))] focus:outline-none sm:text-sm text-xs text-gray-700 dark:text-gray-300 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-text'
            }`}
            style={{ cursor: isSubmitting ? 'not-allowed' : 'text' }}
            autoFocus
          />
        ) : (
          <div className="flex items-center w-full pr-2">
            <span className="sm:text-sm text-xs grow text-gray-700 dark:text-gray-300">
              {originalImageName}
            </span>
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Tooltip tooltip="Rename file">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isSubmitting) {
                      onEdit(originalImageName);
                    }
                  }}
                  disabled={isSubmitting}
                  className={`flex items-center justify-center w-6 h-6 rounded-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  style={{ cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
                >
                  <PencilIcon className="w-4 h-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
                </button>
              </Tooltip>
              <Tooltip tooltip="Preview image">
                <button
                  type="button"
                  onClick={() => openDisplay()}
                  className={`flex items-center justify-center w-6 h-6 rounded-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  style={{ cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
                >
                  <ZoomIcon className="w-4 h-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
                </button>
              </Tooltip>
            </div>
          </div>
        )}
      </li>
    );
  }
);

FileItem.displayName = 'FileItem';
