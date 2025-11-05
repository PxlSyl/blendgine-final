import { useProjectSetupStore } from '../main';
import { useLayerPreviewStore } from '../layerPreviewStore';
import { useRenameStore } from '../renameStore';
import { useIsSelectedStore } from '../main/isSelectedStore';

export const useProjectSetup = () => {
  // Main ProjectSetup Store
  const collectionName = useProjectSetupStore((state) => state.collectionName);
  const collectionDescription = useProjectSetupStore((state) => state.collectionDescription);
  const selectedFolder = useProjectSetupStore((state) => state.selectedFolder);
  const exportFolder = useProjectSetupStore((state) => state.exportFolder);
  const includeRarity = useProjectSetupStore((state) => state.includeRarity);
  const maxFrames = useProjectSetupStore((state) => state.maxFrames);
  const isAnimatedCollection = useProjectSetupStore((state) => state.isAnimatedCollection);
  const spritesheetLayout = useProjectSetupStore((state) => state.spritesheetLayout);
  const projectId = useProjectSetupStore((state) => state.projectId);
  const showContent = useProjectSetupStore((state) => state.showContent);
  const errorMessage = useProjectSetupStore((state) => state.errorMessage);

  const handleCollectionNameChange = useProjectSetupStore(
    (state) => state.handleCollectionNameChange
  );
  const handleCollectionDescriptionChange = useProjectSetupStore(
    (state) => state.handleCollectionDescriptionChange
  );
  const setSelectedFolder = useProjectSetupStore((state) => state.setSelectedFolder);
  const setIncludeRarity = useProjectSetupStore((state) => state.setIncludeRarity);
  const setMaxFrames = useProjectSetupStore((state) => state.setMaxFrames);
  const setIsAnimatedCollection = useProjectSetupStore((state) => state.setIsAnimatedCollection);
  const setShowContent = useProjectSetupStore((state) => state.setShowContent);
  const setErrorMessage = useProjectSetupStore((state) => state.setErrorMessage);

  const getInputFields = useProjectSetupStore((state) => state.getInputFields);
  const loadPersistedState = useProjectSetupStore((state) => state.loadPersistedState);
  const validateAndReloadLayers = useProjectSetupStore((state) => state.validateAndReloadLayers);
  const saveState = useProjectSetupStore((state) => state.saveState);
  const resetProjectSetup = useProjectSetupStore((state) => state.resetProjectSetup);
  const handleSelectFolder = useProjectSetupStore((state) => state.handleSelectFolder);
  const handleSelectExportFolder = useProjectSetupStore((state) => state.handleSelectExportFolder);

  // LayerPreview Store
  const layerImages = useLayerPreviewStore((state) => state.layerImages);
  const expandedLayer = useLayerPreviewStore((state) => state.expandedLayer);
  const loadedImages = useLayerPreviewStore((state) => state.loadedImages);
  const loadingStates = useLayerPreviewStore((state) => state.loadingStates);
  const imageCounts = useLayerPreviewStore((state) => state.imageCounts);
  const layerPreviewProjectId = useLayerPreviewStore((state) => state.projectId);

  const setLayerImages = useLayerPreviewStore((state) => state.setLayerImages);
  const setExpandedLayer = useLayerPreviewStore((state) => state.setExpandedLayer);
  const setLoadedImage = useLayerPreviewStore((state) => state.setLoadedImage);
  const setLoadingState = useLayerPreviewStore((state) => state.setLoadingState);
  const updateImageCount = useLayerPreviewStore((state) => state.updateImageCount);
  const loadLayerImageNames = useLayerPreviewStore((state) => state.loadLayerImageNames);
  const resetLayerPreviewStore = useLayerPreviewStore((state) => state.resetLayerPreviewStore);
  const updateLayerName = useLayerPreviewStore((state) => state.updateLayerName);
  const forceUpdate = useLayerPreviewStore((state) => state.forceUpdate);
  const setProjectIdInPreview = useLayerPreviewStore((state) => state.setProjectId);
  const reloadAllImages = useLayerPreviewStore((state) => state.reloadAllImages);
  const lastUpdate = useLayerPreviewStore((state) => state.lastUpdate);
  const handleLayerExpand = useLayerPreviewStore((state) => state.handleLayerExpand);

  // Rename Store
  const renameLayerOrTrait = useRenameStore((state) => state.renameLayerOrTrait);

  // IsSelected Store
  const hasSelectedFolder = useIsSelectedStore((state) => state.hasSelectedFolder);
  const setHasSelectedFolder = useIsSelectedStore((state) => state.setHasSelectedFolder);

  return {
    // Main ProjectSetup Store
    collectionName,
    collectionDescription,
    selectedFolder,
    exportFolder,
    includeRarity,
    maxFrames,
    isAnimatedCollection,
    spritesheetLayout,
    projectId,
    showContent,
    errorMessage,
    handleCollectionNameChange,
    handleCollectionDescriptionChange,
    setSelectedFolder,
    setIncludeRarity,
    setMaxFrames,
    setIsAnimatedCollection,
    setShowContent,
    setErrorMessage,
    getInputFields,
    loadPersistedState,
    validateAndReloadLayers,
    saveState,
    resetProjectSetup,
    handleSelectFolder,
    handleSelectExportFolder,

    // LayerPreview Store
    layerImages,
    expandedLayer,
    loadedImages,
    loadingStates,
    imageCounts,
    layerPreviewProjectId,
    setLayerImages,
    setExpandedLayer,
    setLoadedImage,
    setLoadingState,
    updateImageCount,
    loadLayerImageNames,
    resetLayerPreviewStore,
    updateLayerName,
    forceUpdate,
    setProjectIdInPreview,
    reloadAllImages,
    lastUpdate,
    handleLayerExpand,

    // Rename Store
    renameLayerOrTrait,

    // IsSelected Store
    hasSelectedFolder,
    setHasSelectedFolder,
  };
};
