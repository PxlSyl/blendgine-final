import type {
  FilterName,
  FilterOptions,
  FilterInstance,
  FlipOptions,
  TintingOptions,
  FilterStoreState as EffectFilterStoreState,
  FlipFlopState as EffectFlipFlopState,
  TintingSliceState as EffectTintingSliceState,
} from '@/types/effect';

export type FilterStoreState = EffectFilterStoreState;
export type FlipFlopState = EffectFlipFlopState;
export type TintingSliceState = EffectTintingSliceState;

export type { FilterName, FilterOptions, FilterInstance };

export interface PipelinePreviewImage {
  pipelineId: string;
  previewImagePath: string;
  originalImagePath: string;
  effects: FilterInstance[];
  timestamp: number;
  exportFormat: string;
  isAnimated: boolean;
}

export interface PipelinePreviewState {
  pipelinePreviews: Record<string, PipelinePreviewImage>;
  activePreviewId: string | null;
}

export interface FilterStoreActions {
  initializeStore: () => Promise<void>;
  setSourceFolder: (folder: string) => void;
  setDestinationFolder: (folder: string) => void;
  setHasUserSelectedFolders: (value: boolean) => void;
  setExportFormat: (format: string) => void;
  setIsAnimated: (value: boolean) => void;
  syncExportFormatWithLastCollection: () => Promise<void>;
  setFlipOptions: (options: FlipOptions) => void;
  setTintingState: (state: {
    tintingOptions: TintingOptions;
    selectedPaletteName: string;
    lastAdjustmentMade: boolean;
  }) => void;
  loadPersistedState: () => Promise<void>;
  saveState: () => Promise<void>;
  resetFilterStore: () => Promise<void>;
}

export interface FlipFlopActions {
  updateFlipOptions: (options: Partial<FlipOptions>) => void;
  syncWithBackend: () => Promise<void>;
  loadFromBackend: () => Promise<void>;
  toggleIncludeFlipFlopInMetadata: () => void;
}

export interface TintingSliceActions {
  initializeTintingStore: () => Promise<void>;
  addFilter: (filterType: FilterName) => void;
  removeFilter: (filterId: string) => void;
  removeAllFilters: () => void;
  updateFilter: (filterId: string, updates: Partial<FilterOptions>) => void;
  toggleFilter: (filterId: string) => void;

  equalizePercentages: () => void;
  randomizePercentages: () => void;
  resetPercentages: () => void;
  getTotalPercentage: () => number;

  updatePipelineDistributionPercentage: (pipelineId: string, percentage: number) => void;
  getTotalDistributionPercentage: () => number;

  toggleFilterMetadata: (filterId: string) => void;
  toggleIncludeFilterInMetadata: () => void;

  syncWithBackend: () => Promise<void>;
  loadFromBackend: () => Promise<void>;
  syncWithFilterStore: () => void;
  loadFromFilterStore: () => void;

  addPipeline: (name?: string) => void;
  removePipeline: (pipelineId: string) => void;
  setActivePipeline: (pipelineId: string) => void;
  updatePipelineName: (pipelineId: string, name: string) => void;
  duplicatePipeline: (pipelineId: string, newName?: string) => void;
  reorderPipelines: (activeId: string, overId: string) => void;
  reorderFiltersInActivePipeline: (oldIndex: number, newIndex: number) => void;
}
export interface PipelinePreviewActions {
  storePipelinePreview: (
    pipelineId: string,
    previewData: Omit<PipelinePreviewImage, 'pipelineId' | 'timestamp'>
  ) => void;
  getPipelinePreview: (pipelineId: string) => PipelinePreviewImage | null;
  hasPipelinePreview: (pipelineId: string) => boolean;
  clearPipelinePreview: (pipelineId: string) => void;
  clearAllPipelinePreviews: () => void;
  getMostRecentPipelinePreview: (pipelineId: string) => PipelinePreviewImage | null;
}
