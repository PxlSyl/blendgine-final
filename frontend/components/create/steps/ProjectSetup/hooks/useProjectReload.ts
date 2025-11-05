import { useCallback } from 'react';

import { api } from '@/services';

import { useProjectSetup } from '@/components/store/projectSetup/hook';
import { useLayerOrder } from '@/components/store/layerOrder/hook';

import { removeFileExtension } from '@/utils/functionsUtils';

export const useProjectReload = () => {
  const { selectedFolder, setShowContent, validateAndReloadLayers, loadedImages, reloadAllImages } =
    useProjectSetup();

  const { setOrderedLayers } = useLayerOrder();

  const handleReload = useCallback(async () => {
    if (!selectedFolder) {
      return;
    }

    await validateAndReloadLayers(selectedFolder);

    const needsReload = !loadedImages || Object.keys(loadedImages).length === 0;
    if (needsReload) {
      await reloadAllImages();
    }

    const layerFolders = await api.readLayers(selectedFolder);
    const cleanedLayerFolders = layerFolders.map(removeFileExtension);
    setOrderedLayers(cleanedLayerFolders);

    setShowContent(true);
  }, [
    selectedFolder,
    validateAndReloadLayers,
    setShowContent,
    loadedImages,
    reloadAllImages,
    setOrderedLayers,
  ]);

  return handleReload;
};
