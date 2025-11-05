import { useState, useEffect } from 'react';
import { Effect } from 'effect';
import { DragEndEvent } from '@dnd-kit/core';
import { useFilters } from '@/components/store/filters/hook';
import { joinPaths } from '@/utils/functionsUtils';
import { api } from '@/services';
import { MAX_FILTERS } from '../constants';

interface FolderResponse {
  path: string;
  status: 'Confirmed' | 'Cancelled' | { Error: string };
}

interface FolderError {
  message: string;
}

export const useFiltersSetup = () => {
  const {
    tintingOptions,
    flipOptions,
    sourceFolder,
    destinationFolder,
    exportFormat,
    isAnimated,
    expandedFilters,
    isAddFilterModalOpen,
    addFilter,
    updateFilter,
    toggleFilter,
    removeFilter,
    removeAllFilters,
    setSourceFolder,
    setDestinationFolder,
    setHasUserSelectedFolders,
    setExportFormat,
    setIsAnimated,
    syncExportFormatWithLastCollection,
    saveState,
    reorderFiltersInActivePipeline,
    toggleFilterExpansion,
    expandAllFilters,
    collapseAllFilters,
    setIsAddFilterModalOpen,
  } = useFilters();

  const [sourceFolderError, setSourceFolderError] = useState<string | null>(null);
  const [destinationFolderError, setDestinationFolderError] = useState<string | null>(null);

  const exportFormats = ['png', 'jpg', 'webp', 'gif', 'mp4', 'webm'];
  const animatedFormats = ['gif', 'webp', 'mp4', 'webm'];

  const isToggleEnabled = animatedFormats.includes(exportFormat.toLowerCase());

  const addCollectionSubfolder = (path: string) => {
    return joinPaths(path, 'collection');
  };

  useEffect(() => {
    const setupDefaultFolders = async () => {
      if (!sourceFolder || !destinationFolder) {
        await Effect.try({
          try: async () => {
            const lastCollection = await api.getLastCreatedCollection();
            if (lastCollection && (await api.checkFolderExists(lastCollection))) {
              if (!sourceFolder) {
                const collectionSubfolder = addCollectionSubfolder(lastCollection);
                const folderExists = await api.checkFolderExists(collectionSubfolder);
                const finalSourceFolder = folderExists ? collectionSubfolder : lastCollection;
                setSourceFolder(finalSourceFolder);
              }
              if (!destinationFolder) {
                setDestinationFolder(lastCollection);
              }
            } else {
              console.warn('[FiltersSetup] No valid last collection found');
            }
          },
          catch: (error) => {
            console.warn('Error setting up default folders:', error);
            setSourceFolderError(
              error instanceof Error ? error.message : 'Failed to setup default folders'
            );
          },
        }).pipe(Effect.runPromise);
      } else {
        console.warn('[FiltersSetup] Folders already set, skipping setup');
      }
    };

    void setupDefaultFolders();
  }, [sourceFolder, destinationFolder, setSourceFolder, setDestinationFolder]);

  useEffect(() => {
    const syncExportFormat = async () => {
      await Effect.try({
        try: async () => {
          await syncExportFormatWithLastCollection();
        },
        catch: (error) => {
          console.warn('Error syncing export format:', error);
        },
      }).pipe(Effect.runPromise);
    };

    void syncExportFormat();
  }, [syncExportFormatWithLastCollection]);

  useEffect(() => {
    if (exportFormat) {
      void saveState();
    }
  }, [exportFormat, saveState]);

  useEffect(() => {
    if (sourceFolder || destinationFolder) {
      void saveState();
    }
  }, [sourceFolder, destinationFolder, saveState]);

  const handleSourceFolderSelect = async () => {
    setSourceFolderError(null);

    await Effect.try({
      try: async () => {
        const result = await api.selectSourceFolder();
        if (result) {
          setSourceFolder(result);
          setHasUserSelectedFolders(true);
          setDestinationFolder(result);
        }
      },
      catch: (error) => {
        const folderError = error as FolderError;
        setSourceFolderError(folderError.message || 'Failed to select source folder');
      },
    }).pipe(Effect.runPromise);
  };

  const handleDestinationFolderSelect = async () => {
    setDestinationFolderError(null);

    await Effect.try({
      try: async () => {
        const response = await api.selectDestinationFolder();

        if (response && typeof response === 'object' && 'status' in response) {
          const folderResponse = response as FolderResponse;

          if (folderResponse.status === 'Confirmed') {
            setDestinationFolder(folderResponse.path);
            setHasUserSelectedFolders(true);
            await saveState();
          } else if (folderResponse.status === 'Cancelled') {
            //
          } else if (
            typeof folderResponse.status === 'object' &&
            'Error' in folderResponse.status
          ) {
            setDestinationFolderError(folderResponse.status.Error);
          }
        }
      },
      catch: (error) => {
        console.error('Failed to select destination folder:', error);
        const folderError = error as FolderError;
        setDestinationFolderError(folderError.message || 'Failed to select destination folder');
      },
    }).pipe(Effect.runPromise);
  };

  const areFiltersActive = () => {
    const hasAnyEffects = tintingOptions.pipelines.some((p) => p.effects.length > 0);
    const activeFlipOptions =
      flipOptions &&
      (flipOptions.horizontalFlipPercentage > 0 || flipOptions.verticalFlipPercentage > 0);
    return hasAnyEffects || activeFlipOptions;
  };

  const getActiveEffects = () => {
    const activePipeline = tintingOptions.pipelines.find(
      (p) => p.id === tintingOptions.activePipelineId
    );
    return activePipeline?.effects.filter((effect) => effect.enabled) ?? [];
  };

  const getAllEffects = () => {
    const activePipeline = tintingOptions.pipelines.find(
      (p) => p.id === tintingOptions.activePipelineId
    );
    return activePipeline?.effects ?? [];
  };

  const canAddMoreFilters = () => {
    return getAllEffects().length <= MAX_FILTERS;
  };

  const handleExpandAllFilters = () => {
    const effects = getAllEffects();
    if (effects.length === 0) {
      return;
    }

    const filterIds = effects.map((effect) => effect.id);
    expandAllFilters(filterIds);
  };

  const handleCollapseAllFilters = () => {
    collapseAllFilters();
  };

  const hasFiltersToExpand = () => {
    return getAllEffects().length > 0;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const effects = getAllEffects();
      const oldIndex = effects.findIndex((effect) => effect.id === active.id);
      const newIndex = effects.findIndex((effect) => effect.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderFiltersInActivePipeline(oldIndex, newIndex);
      }
    }
  };

  const handleExportFormatChange = (newFormat: string) => {
    setExportFormat(newFormat);
    setTimeout(() => {
      if (exportFormat !== newFormat) {
        console.warn(`[FiltersSetup] Format mismatch: expected ${newFormat}, got ${exportFormat}`);
        setExportFormat(newFormat);
      }
    }, 50);
  };

  const transitionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  };

  return {
    tintingOptions,
    flipOptions,
    sourceFolder,
    destinationFolder,
    exportFormat,
    isAnimated,
    expandedFilters,
    isAddFilterModalOpen,
    sourceFolderError,
    destinationFolderError,
    exportFormats,
    isToggleEnabled,
    transitionVariants,

    addFilter,
    updateFilter,
    toggleFilter,
    removeFilter,
    removeAllFilters,
    setIsAnimated,
    toggleFilterExpansion,
    setIsAddFilterModalOpen,

    handleSourceFolderSelect,
    handleDestinationFolderSelect,
    handleExpandAllFilters,
    handleCollapseAllFilters,
    handleDragEnd,
    handleExportFormatChange,

    areFiltersActive,
    getActiveEffects,
    getAllEffects,
    canAddMoreFilters,
    hasFiltersToExpand,
  };
};
