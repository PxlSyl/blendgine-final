import { useRarityStore } from '../main';
import { useRarityUIStore } from '../rarityUIStore';
import { useGlobalRarityStore } from '../globalRarityStore';

export const useRarity = () => {
  // Main Rarity Store
  const updateRarity = useRarityStore((state) => state.updateRarity);
  const equalizeRarity = useRarityStore((state) => state.equalizeRarity);
  const randomizeLayer = useRarityStore((state) => state.randomizeLayer);
  const resetLayerRarity = useRarityStore((state) => state.resetLayerRarity);
  const handleSkipToggle = useRarityStore((state) => state.handleSkipToggle);
  const getRarity = useRarityStore((state) => state.getRarity);
  const getRarityConfig = useRarityStore((state) => state.getRarityConfig);
  const getActiveLayers = useRarityStore((state) => state.getActiveLayers);
  const getOrderedLayers = useRarityStore((state) => state.getOrderedLayers);
  const validateLayerProbabilities = useRarityStore((state) => state.validateLayerProbabilities);
  const toggleLock = useRarityStore((state) => state.toggleLock);
  const adjustRarityValues = useRarityStore((state) => state.adjustRarityValues);
  const submitRarityConfig = useRarityStore((state) => state.submitRarityConfig);
  const equalizeAllLayers = useRarityStore((state) => state.equalizeAllLayers);
  const randomizeAllLayers = useRarityStore((state) => state.randomizeAllLayers);
  const resetAll = useRarityStore((state) => state.resetAll);
  const clearForcedCombinationsCache = useRarityStore(
    (state) => state.clearForcedCombinationsCache
  );

  // Rarity UI Store
  const viewMode = useRarityUIStore((state) => state.viewMode);
  const chartViewMode = useRarityUIStore((state) => state.chartViewMode);
  const selectedLayer = useRarityUIStore((state) => state.selectedLayer);
  const expandedLayers = useRarityUIStore((state) => state.expandedLayers);
  const wasGlobalViewActive = useRarityUIStore((state) => state.wasGlobalViewActive);
  const setViewMode = useRarityUIStore((state) => state.setViewMode);
  const setChartViewMode = useRarityUIStore((state) => state.setChartViewMode);
  const setSelectedLayer = useRarityUIStore((state) => state.setSelectedLayer);
  const toggleLayer = useRarityUIStore((state) => state.toggleLayer);
  const setLayerExpanded = useRarityUIStore((state) => state.setLayerExpanded);
  const initializeLayers = useRarityUIStore((state) => state.initializeLayers);
  const resetLayers = useRarityUIStore((state) => state.resetLayers);
  const resetRarityUIStore = useRarityUIStore((state) => state.resetRarityUIStore);

  // Global Rarity Store
  const isGlobalViewActive = useGlobalRarityStore((state) => state.isGlobalViewActive);
  const lastActiveSet = useGlobalRarityStore((state) => state.lastActiveSet);
  const persistedRarityData = useGlobalRarityStore((state) => state.persistedRarityData);
  const setGlobalViewActive = useGlobalRarityStore((state) => state.setGlobalViewActive);
  const toggleGlobalView = useGlobalRarityStore((state) => state.toggleGlobalView);

  const getGlobalRarityData = useGlobalRarityStore((state) => state.getGlobalRarityData);
  const updateGlobalRarityFromConfig = useGlobalRarityStore(
    (state) => state.updateGlobalRarityFromConfig
  );
  const refreshGlobalRarityData = useGlobalRarityStore((state) => state.refreshGlobalRarityData);

  return {
    // Main Rarity Store
    updateRarity,
    equalizeRarity,
    randomizeLayer,
    resetLayerRarity,
    handleSkipToggle,
    getRarity,
    getRarityConfig,
    getActiveLayers,
    getOrderedLayers,
    validateLayerProbabilities,
    toggleLock,
    adjustRarityValues,
    submitRarityConfig,
    equalizeAllLayers,
    randomizeAllLayers,
    resetAll,
    clearForcedCombinationsCache,

    // Rarity UI Store
    viewMode,
    chartViewMode,
    selectedLayer,
    expandedLayers,
    wasGlobalViewActive,
    setViewMode,
    setChartViewMode,
    setSelectedLayer,
    toggleLayer,
    setLayerExpanded,
    initializeLayers,
    resetLayers,
    resetRarityUIStore,

    // Global Rarity Store
    isGlobalViewActive,
    lastActiveSet,
    persistedRarityData,
    setGlobalViewActive,
    toggleGlobalView,
    getGlobalRarityData,
    updateGlobalRarityFromConfig,
    refreshGlobalRarityData,
  };
};
