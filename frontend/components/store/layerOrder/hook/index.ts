import { useLayerOrderStore } from '../main';
import { usePreview3DStore } from '../preview3Dstore';
import { usePreviewCanvasStore } from '../previewCanvasStore';
import { useGeneratePreviewStore } from '../generatePreviewStore';
import { useCombinationsStore } from '../combinationsStore';

export const useLayerOrder = () => {
  // Main Layer Order Store - Layer management, sets, rarity
  const sets = useLayerOrderStore((state) => state.sets);
  const activeSetId = useLayerOrderStore((state) => state.activeSetId);
  const rarityConfig = useLayerOrderStore((state) => state.rarityConfig);
  const setOrders = useLayerOrderStore((state) => state.setOrders);
  const forcedTraits = useLayerOrderStore((state) => state.forcedTraits);
  const lastUpdate = useLayerOrderStore((state) => state.lastUpdate);
  const expandedLayers = useLayerOrderStore((state) => state.expandedLayers);

  // main store actions
  const addSet = useLayerOrderStore((state) => state.addSet);
  const duplicateSet = useLayerOrderStore((state) => state.duplicateSet);
  const deleteSet = useLayerOrderStore((state) => state.deleteSet);
  const setActiveSet = useLayerOrderStore((state) => state.setActiveSet);
  const setOrderedLayers = useLayerOrderStore((state) => state.setOrderedLayers);
  const getAllActiveLayers = useLayerOrderStore((state) => state.getAllActiveLayers);
  const moveLayer = useLayerOrderStore((state) => state.moveLayer);
  const toggleLayerDisabled = useLayerOrderStore((state) => state.toggleLayerDisabled);
  const toggleTraitDisabled = useLayerOrderStore((state) => state.toggleTraitDisabled);
  const toggleLayerExpansion = useLayerOrderStore((state) => state.toggleLayerExpansion);
  const setRarityConfig = useLayerOrderStore((state) => state.setRarityConfig);
  const updateRarityConfig = useLayerOrderStore((state) => state.updateRarityConfig);
  const saveRarityConfig = useLayerOrderStore((state) => state.saveRarityConfig);
  const loadRarityConfig = useLayerOrderStore((state) => state.loadRarityConfig);
  const getActiveLayers = useLayerOrderStore((state) => state.getActiveLayers);
  const addLayer = useLayerOrderStore((state) => state.addLayer);
  const loadPersistedState = useLayerOrderStore((state) => state.loadPersistedState);
  const saveState = useLayerOrderStore((state) => state.saveState);
  const expandAllLayers = useLayerOrderStore((state) => state.expandAllLayers);
  const collapseAllLayers = useLayerOrderStore((state) => state.collapseAllLayers);
  const enableAllLayers = useLayerOrderStore((state) => state.enableAllLayers);
  const disableAllLayers = useLayerOrderStore((state) => state.disableAllLayers);
  const setForcedTrait = useLayerOrderStore((state) => state.setForcedTrait);
  const removeForcedTrait = useLayerOrderStore((state) => state.removeForcedTrait);
  const getOrderedLayers = useLayerOrderStore((state) => state.getOrderedLayers);
  const isLayerActive = useLayerOrderStore((state) => state.isLayerActive);
  const isTraitEnabled = useLayerOrderStore((state) => state.isTraitEnabled);
  const updateOrderedLayers = useLayerOrderStore((state) => state.updateOrderedLayers);
  const updateSetNFTCount = useLayerOrderStore((state) => state.updateSetNFTCount);
  const getTotalNFTCount = useLayerOrderStore((state) => state.getTotalNFTCount);
  const setCustomSetName = useLayerOrderStore((state) => state.setCustomSetName);
  const reorderSets = useLayerOrderStore((state) => state.reorderSets);
  const initializeSetOrders = useLayerOrderStore((state) => state.initializeSetOrders);
  const forceUpdate = useLayerOrderStore((state) => state.forceUpdate);
  const resetLayerOrderStore = useLayerOrderStore((state) => state.resetLayerOrderStore);

  // Preview 3D Store - 3D preview, animations, camera
  const viewMode = usePreview3DStore((state) => state.viewMode);
  const isGenerating = usePreview3DStore((state) => state.isGenerating);
  const generationId = usePreview3DStore((state) => state.generationId);
  const currentGenerationId = usePreview3DStore((state) => state.currentGenerationId);
  const cameraType = usePreview3DStore((state) => state.cameraType);
  const lightingParams = usePreview3DStore((state) => state.lightingParams);
  const dimensions = usePreview3DStore((state) => state.dimensions);
  const fps = usePreview3DStore((state) => state.fps);
  const currentFrame = usePreview3DStore((state) => state.currentFrame);
  const maxFrames = usePreview3DStore((state) => state.maxFrames);
  const animationState = usePreview3DStore((state) => state.animationState);
  const framesByLayer = usePreview3DStore((state) => state.framesByLayer);
  const perspectiveCameraState = usePreview3DStore((state) => state.perspectiveCameraState);
  const orthographicCameraState = usePreview3DStore((state) => state.orthographicCameraState);
  const perspectiveParams = usePreview3DStore((state) => state.perspectiveParams);
  const orthographicParams = usePreview3DStore((state) => state.orthographicParams);
  const perspectiveControls = usePreview3DStore((state) => state.perspectiveControls);
  const orthographicControls = usePreview3DStore((state) => state.orthographicControls);
  const needsUpdate = usePreview3DStore((state) => state.needsUpdate);

  // preview 3D store actions
  const setViewMode = usePreview3DStore((state) => state.setViewMode);
  const triggerGeneration = usePreview3DStore((state) => state.triggerGeneration);
  const clearCache = usePreview3DStore((state) => state.clearCache);
  const setMeshes = usePreview3DStore((state) => state.setMeshes);
  const setIsGenerating = usePreview3DStore((state) => state.setIsGenerating);
  const createMesh = usePreview3DStore((state) => state.createMesh);
  const updateMeshTextures = usePreview3DStore((state) => state.updateMeshTextures);
  const cleanupMesh = usePreview3DStore((state) => state.cleanupMesh);
  const setCameraType = usePreview3DStore((state) => state.setCameraType);
  const setPerspectiveCameraState = usePreview3DStore((state) => state.setPerspectiveCameraState);
  const setOrthographicCameraState = usePreview3DStore((state) => state.setOrthographicCameraState);
  const setPerspectiveControls = usePreview3DStore((state) => state.setPerspectiveControls);
  const setOrthographicControls = usePreview3DStore((state) => state.setOrthographicControls);
  const setLayerSpacing = usePreview3DStore((state) => state.setLayerSpacing);
  const setLayerThickness = usePreview3DStore((state) => state.setLayerThickness);
  const getCurrentControls = usePreview3DStore((state) => state.getCurrentControls);
  const getCurrentParams = usePreview3DStore((state) => state.getCurrentParams);
  const setCurrentControls = usePreview3DStore((state) => state.setCurrentControls);
  const resetToFlatView = usePreview3DStore((state) => state.resetToFlatView);
  const setZoom = usePreview3DStore((state) => state.setZoom);
  const updateCamera = usePreview3DStore((state) => state.updateCamera);
  const setActiveControls = usePreview3DStore((state) => state.setActiveControls);
  const setCamera = usePreview3DStore((state) => state.setCamera);
  const setDimensions = usePreview3DStore((state) => state.setDimensions);
  const setPerspectiveParams = usePreview3DStore((state) => state.setPerspectiveParams);
  const setOrthographicParams = usePreview3DStore((state) => state.setOrthographicParams);
  const validateMeshes = usePreview3DStore((state) => state.validateMeshes);
  const updateDimensions = usePreview3DStore((state) => state.updateDimensions);
  const startAnimation = usePreview3DStore((state) => state.startAnimation);
  const stopAnimation = usePreview3DStore((state) => state.stopAnimation);
  const loadAnimatedImages = usePreview3DStore((state) => state.loadAnimatedImages);
  const loadBlendedFrames = usePreview3DStore((state) => state.loadBlendedFrames);
  const setFPS = usePreview3DStore((state) => state.setFPS);
  const setCurrentFrame = usePreview3DStore((state) => state.setCurrentFrame);
  const setMaxFrames = usePreview3DStore((state) => state.setMaxFrames);
  const setAnimationState = usePreview3DStore((state) => state.setAnimationState);
  const handleGenerationStateChange = usePreview3DStore(
    (state) => state.handleGenerationStateChange
  );
  const resetPreview3DStore = usePreview3DStore((state) => state.resetPreview3DStore);
  const setGenerationId = usePreview3DStore((state) => state.setGenerationId);
  const handleCameraRestore = usePreview3DStore((state) => state.handleCameraRestore);
  const handleMeshUpdate = usePreview3DStore((state) => state.handleMeshUpdate);
  const handleCameraSave = usePreview3DStore((state) => state.handleCameraSave);
  const cleanupMeshesFromScene = usePreview3DStore((state) => state.cleanupMeshesFromScene);
  const clearGeometryCache = usePreview3DStore((state) => state.clearGeometryCache);
  const clearTextureCache = usePreview3DStore((state) => state.clearTextureCache);

  // Preview Canvas Store - 2D preview, images
  const images = usePreviewCanvasStore((state) => state.images);
  const error = usePreviewCanvasStore((state) => state.error);
  const canvasFramesByLayer = usePreviewCanvasStore((state) => state.framesByLayer);

  // preview canvas store actions
  const resetPreviewCanvasStore = usePreviewCanvasStore((state) => state.resetPreviewCanvasStore);
  const loadImages = usePreviewCanvasStore((state) => state.loadImages);
  const updateImagesOrder = usePreviewCanvasStore((state) => state.updateImagesOrder);
  const clearImages = usePreviewCanvasStore((state) => state.clearImages);

  // Generate Preview Store - Preview generation
  const generatePreview = useGeneratePreviewStore((state) => state.generatePreview);
  const forceTraitPreview = useGeneratePreviewStore((state) => state.forceTraitPreview);
  const getLayerImage = useGeneratePreviewStore((state) => state.getLayerImage);
  const clearImageCache = useGeneratePreviewStore((state) => state.clearImageCache);
  const sortLayersByZIndex = useGeneratePreviewStore((state) => state.sortLayersByZIndex);
  const checkTraitCompatibility = useGeneratePreviewStore((state) => state.checkTraitCompatibility);
  const checkForcedCombinations = useGeneratePreviewStore((state) => state.checkForcedCombinations);

  // Combinations Store - Possible combinations
  const possibleCombinations = useCombinationsStore((state) => state.possibleCombinations);
  const calculatePossibleCombinations = useCombinationsStore(
    (state) => state.calculatePossibleCombinations
  );
  const setPossibleCombinations = useCombinationsStore((state) => state.setPossibleCombinations);

  return {
    // Main Layer Order Store - State
    sets,
    activeSetId,
    rarityConfig,
    setOrders,
    forcedTraits,
    lastUpdate,
    expandedLayers,

    // Main Layer Order Store - Actions
    addSet,
    duplicateSet,
    deleteSet,
    setActiveSet,
    setOrderedLayers,
    getAllActiveLayers,
    moveLayer,
    toggleLayerDisabled,
    toggleTraitDisabled,
    toggleLayerExpansion,
    setRarityConfig,
    updateRarityConfig,
    saveRarityConfig,
    loadRarityConfig,
    getActiveLayers,
    addLayer,
    loadPersistedState,
    saveState,
    expandAllLayers,
    collapseAllLayers,
    enableAllLayers,
    disableAllLayers,
    setForcedTrait,
    removeForcedTrait,
    getOrderedLayers,
    isLayerActive,
    isTraitEnabled,
    updateOrderedLayers,
    updateSetNFTCount,
    getTotalNFTCount,
    setCustomSetName,
    reorderSets,
    initializeSetOrders,
    forceUpdate,
    resetLayerOrderStore,

    // Preview 3D Store - State
    viewMode,
    isGenerating,
    generationId,
    currentGenerationId,
    cameraType,
    lightingParams,
    dimensions,
    fps,
    currentFrame,
    maxFrames,
    animationState,
    framesByLayer,
    perspectiveCameraState,
    orthographicCameraState,
    perspectiveParams,
    orthographicParams,
    perspectiveControls,
    orthographicControls,

    // Preview 3D Store - Actions
    setViewMode,
    triggerGeneration,
    clearCache,
    setMeshes,
    setIsGenerating,
    createMesh,
    updateMeshTextures,
    cleanupMesh,
    setCameraType,
    setPerspectiveCameraState,
    setOrthographicCameraState,
    setPerspectiveControls,
    setOrthographicControls,
    setLayerSpacing,
    setLayerThickness,
    getCurrentControls,
    getCurrentParams,
    setCurrentControls,
    resetToFlatView,
    setZoom,
    updateCamera,
    setActiveControls,
    setCamera,
    setDimensions,
    setPerspectiveParams,
    setOrthographicParams,
    validateMeshes,
    updateDimensions,
    startAnimation,
    stopAnimation,
    loadAnimatedImages,
    loadBlendedFrames,
    setFPS,
    setCurrentFrame,
    setMaxFrames,
    setAnimationState,
    handleGenerationStateChange,
    resetPreview3DStore,
    setGenerationId,
    cleanupMeshesFromScene,
    clearGeometryCache,
    clearTextureCache,
    handleCameraRestore,
    handleMeshUpdate,
    handleCameraSave,
    needsUpdate,

    // Preview Canvas Store - State
    images,
    error,
    canvasFramesByLayer,

    // Preview Canvas Store - Actions
    resetPreviewCanvasStore,
    loadImages,
    updateImagesOrder,
    clearImages,

    // Generate Preview Store - Actions
    generatePreview,
    forceTraitPreview,
    getLayerImage,
    clearImageCache,
    sortLayersByZIndex,
    checkTraitCompatibility,
    checkForcedCombinations,

    // Combinations Store - State
    possibleCombinations,

    // Combinations Store - Actions
    calculatePossibleCombinations,
    setPossibleCombinations,
  };
};
