import { useFlipFlopStore } from '../flipflop';
import { useFilterStore } from '../files';
import { usePreviewCanvasStore } from '../preview';
import { useTintingStore } from '../main';

export const useFilters = () => {
  // FlipFlop
  const flipOptions = useFlipFlopStore((state) => state.flipOptions);
  const updateFlipOptions = useFlipFlopStore((state) => state.updateFlipOptions);
  const syncFlipFlopWithBackend = useFlipFlopStore((state) => state.syncWithBackend);
  const loadFlipFlopWithBackend = useFlipFlopStore((state) => state.loadFromBackend);
  const toggleIncludeFlipFlopInMetadata = useFlipFlopStore(
    (state) => state.toggleIncludeFlipFlopInMetadata
  );

  // Files
  const sourceFolder = useFilterStore((state) => state.sourceFolder);
  const destinationFolder = useFilterStore((state) => state.destinationFolder);
  const hasUserSelectedFolders = useFilterStore((state) => state.hasUserSelectedFolders);
  const exportFormat = useFilterStore((state) => state.exportFormat);
  const isAnimated = useFilterStore((state) => state.isAnimated);
  const setSourceFolder = useFilterStore((state) => state.setSourceFolder);
  const setDestinationFolder = useFilterStore((state) => state.setDestinationFolder);
  const setHasUserSelectedFolders = useFilterStore((state) => state.setHasUserSelectedFolders);
  const setExportFormat = useFilterStore((state) => state.setExportFormat);
  const setIsAnimated = useFilterStore((state) => state.setIsAnimated);
  const syncExportFormatWithLastCollection = useFilterStore(
    (state) => state.syncExportFormatWithLastCollection
  );
  const setFlipOptionsInFiles = useFilterStore((state) => state.setFlipOptions);
  const setTintingState = useFilterStore((state) => state.setTintingState);
  const loadPersistedState = useFilterStore((state) => state.loadPersistedState);
  const saveState = useFilterStore((state) => state.saveState);
  const resetFilterStore = useFilterStore((state) => state.resetFilterStore);

  // Preview
  const isGeneratingPreview = usePreviewCanvasStore((state) => state.isGenerating);
  const previewImage = usePreviewCanvasStore((state) => state.previewImage);
  const originalImage = usePreviewCanvasStore((state) => state.originalImage);
  const currentChainId = usePreviewCanvasStore((state) => state.currentChainId);
  const isSourceImageLocked = usePreviewCanvasStore((state) => state.isSourceImageLocked);
  const generatePreview = usePreviewCanvasStore((state) => state.generatePreview);

  // Tinting
  const tintingOptions = useTintingStore((state) => state.tintingOptions);
  const selectedPaletteName = useTintingStore((state) => state.selectedPaletteName);
  const lastAdjustmentMade = useTintingStore((state) => state.lastAdjustmentMade);

  const toggleIncludeFilterInMetadata = useTintingStore(
    (state) => state.toggleIncludeFilterInMetadata
  );
  const equalizePercentages = useTintingStore((state) => state.equalizePercentages);
  const randomizePercentages = useTintingStore((state) => state.randomizePercentages);
  const resetPercentages = useTintingStore((state) => state.resetPercentages);
  const syncTintingWithBackend = useTintingStore((state) => state.syncWithBackend);
  const loadTintingFromBackend = useTintingStore((state) => state.loadFromBackend);
  const addFilter = useTintingStore((state) => state.addFilter);
  const removeFilter = useTintingStore((state) => state.removeFilter);
  const removeAllFilters = useTintingStore((state) => state.removeAllFilters);
  const updateFilter = useTintingStore((state) => state.updateFilter);
  const toggleFilter = useTintingStore((state) => state.toggleFilter);
  const getTotalPercentage = useTintingStore((state) => state.getTotalPercentage);
  const toggleFilterMetadata = useTintingStore((state) => state.toggleFilterMetadata);
  const toggleSourceImageLock = usePreviewCanvasStore((state) => state.toggleSourceImageLock);
  const syncTintingWithFilterStore = useTintingStore((state) => state.syncWithFilterStore);
  const loadTintingFromFilterStore = useTintingStore((state) => state.loadFromFilterStore);

  // Actions pour les pipelines
  const addPipeline = useTintingStore((state) => state.addPipeline);
  const removePipeline = useTintingStore((state) => state.removePipeline);
  const setActivePipeline = useTintingStore((state) => state.setActivePipeline);
  const updatePipelineName = useTintingStore((state) => state.updatePipelineName);
  const duplicatePipeline = useTintingStore((state) => state.duplicatePipeline);
  const reorderPipelines = useTintingStore((state) => state.reorderPipelines);
  const reorderFiltersInActivePipeline = useTintingStore(
    (state) => state.reorderFiltersInActivePipeline
  );

  // UI state and actions
  const expandedFilters = useTintingStore((state) => state.expandedFilters);
  const isAddFilterModalOpen = useTintingStore((state) => state.isAddFilterModalOpen);
  const toggleFilterExpansion = useTintingStore((state) => state.toggleFilterExpansion);
  const expandAllFilters = useTintingStore((state) => state.expandAllFilters);
  const collapseAllFilters = useTintingStore((state) => state.collapseAllFilters);
  const setIsAddFilterModalOpen = useTintingStore((state) => state.setIsAddFilterModalOpen);

  // Actions de gestion des pourcentages de distribution des pipelines
  const updatePipelineDistributionPercentage = useTintingStore(
    (state) => state.updatePipelineDistributionPercentage
  );
  const getTotalDistributionPercentage = useTintingStore(
    (state) => state.getTotalDistributionPercentage
  );

  return {
    // FlipFlop
    flipOptions,
    updateFlipOptions,
    syncFlipFlopWithBackend,
    loadFlipFlopWithBackend,
    toggleIncludeFlipFlopInMetadata,

    // Files
    sourceFolder,
    destinationFolder,
    hasUserSelectedFolders,
    exportFormat,
    isAnimated,
    setSourceFolder,
    setDestinationFolder,
    setHasUserSelectedFolders,
    setExportFormat,
    setIsAnimated,
    syncExportFormatWithLastCollection,
    setFlipOptionsInFiles,
    setTintingState,
    loadPersistedState,
    saveState,
    resetFilterStore,

    // Preview
    isGeneratingPreview,
    previewImage,
    originalImage,
    currentChainId,
    generatePreview,

    // Tinting
    tintingOptions,
    selectedPaletteName,
    lastAdjustmentMade,
    isSourceImageLocked,
    toggleIncludeFilterInMetadata,
    equalizePercentages,
    randomizePercentages,
    resetPercentages,
    syncTintingWithBackend,
    loadTintingFromBackend,
    addFilter,
    removeFilter,
    removeAllFilters,
    updateFilter,
    toggleFilter,
    getTotalPercentage,
    toggleFilterMetadata,
    toggleSourceImageLock,
    syncTintingWithFilterStore,
    loadTintingFromFilterStore,

    // Actions pour les pipelines
    addPipeline,
    removePipeline,
    setActivePipeline,
    updatePipelineName,
    duplicatePipeline,
    reorderPipelines,
    reorderFiltersInActivePipeline,

    // UI state and actions
    expandedFilters,
    isAddFilterModalOpen,
    toggleFilterExpansion,
    expandAllFilters,
    collapseAllFilters,
    setIsAddFilterModalOpen,

    // Actions de gestion des pourcentages de distribution des pipelines
    updatePipelineDistributionPercentage,
    getTotalDistributionPercentage,
  };
};
