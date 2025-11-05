import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import type { LoadedImage } from '../Medias/CanvasImagePreview';
import { BLEND_MODES } from '@/types/blendModes';

import { useProjectSetup } from '@/components/store/projectSetup/hook';

import { ChevronDownIcon, FolderIcon } from '@/components/icons';
import { EditableName } from './EditableName';
import { FileItem } from './FileItem';
import { useFolderItem } from './hooks/useFolderItem';

interface FolderItemProps {
  folderName: string;
  handleReload: () => Promise<void>;
}

const FolderItemComponent = ({ folderName, handleReload }: FolderItemProps) => {
  const { loadedImages, layerImages, expandedLayer, handleLayerExpand, lastUpdate } =
    useProjectSetup();
  const {
    isEditingFolderName,
    newFolderName,
    editingFileName,
    handleFolderNameSubmit,
    handleFolderKeyDown,
    setIsEditingFolderName,
    handleFileNameSubmit,
    handleFileKeyDown,
    handleStartEditingFile,
  } = useFolderItem({
    folderName,
    handleReload,
  });

  React.useEffect(() => {}, [lastUpdate]);

  const formattedLoadedImages = React.useMemo(() => {
    const formatted: Record<string, LoadedImage> = {};
    Object.entries(loadedImages).forEach(([key, value]) => {
      const mode = value.blend.mode in BLEND_MODES ? value.blend.mode : 'source-over';

      formatted[key] = {
        src: value.src,
        blend: {
          mode,
          opacity: value.blend.opacity,
        },
        dimensions: value.dimensions,
      };
    });
    return formatted;
  }, [loadedImages]);

  const files = React.useMemo(() => {
    const layer = layerImages.find((layer) => layer.layerName === folderName);
    return layer?.imageNames ?? [];
  }, [layerImages, folderName]);

  const imageInfos = React.useMemo(() => {
    const layer = layerImages.find((layer) => layer.layerName === folderName);
    return layer?.imageInfos ?? [];
  }, [layerImages, folderName]);

  return (
    <div className="mb-1">
      <div className="relative group rounded-sm overflow-hidden p-px">
        <button
          className="relative w-full text-left py-2 px-1 flex justify-between items-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
          onClick={() => handleLayerExpand(folderName)}
        >
          <div className="flex items-center">
            <ChevronDownIcon
              className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 mr-1 ${
                expandedLayer.includes(folderName) ? '' : 'transform -rotate-90'
              }`}
            />
            <FolderIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[rgb(var(--color-secondary))] mr-2" />
            <EditableName
              isEditing={isEditingFolderName}
              value={newFolderName}
              onSubmit={() => {
                void handleFolderNameSubmit();
              }}
              onKeyDown={handleFolderKeyDown}
              onEditStart={() => setIsEditingFolderName(true)}
            />
            <span className="ml-2 sm:text-sm text-xs hidden sm:inline text-gray-500 dark:text-gray-400">
              ({files.length} files)
            </span>
          </div>
        </button>
      </div>

      <AnimatePresence>
        {expandedLayer.includes(folderName) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="ml-0 sm:ml-2 bg-gray-100 dark:bg-gray-800 rounded-md p-2"
          >
            <ul className="space-y-1 border-l-2 border-gray-300 dark:border-gray-600">
              {files.map((fileName) => (
                <FileItem
                  key={`${fileName}-${lastUpdate}`}
                  layerName={folderName}
                  originalImageName={fileName}
                  editingFileName={editingFileName}
                  onEdit={handleStartEditingFile}
                  onSubmit={(fileName) => {
                    void handleFileNameSubmit(fileName);
                  }}
                  onKeyDown={handleFileKeyDown}
                  loadedImages={formattedLoadedImages}
                  imageInfos={imageInfos}
                />
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

FolderItemComponent.displayName = 'FolderItem';

export const FolderItem = memo(FolderItemComponent);
