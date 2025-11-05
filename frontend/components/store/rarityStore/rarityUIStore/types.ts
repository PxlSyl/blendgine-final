export type ViewMode = 'settings' | 'visualization';
export type ChartViewMode = 'pie' | 'bar';

export interface RarityUIState {
  expandedLayers: Record<string, Record<string, boolean>>;
  viewMode: ViewMode;
  chartViewMode: ChartViewMode;
  selectedLayer: string | null;
  wasGlobalViewActive: boolean;
  toggleLayer: (layerId: string) => void;
  setLayerExpanded: (layerId: string, isExpanded: boolean) => void;
  initializeLayers: (layers: string[]) => void;
  setViewMode: (mode: ViewMode) => void;
  setChartViewMode: (mode: ChartViewMode) => void;
  setSelectedLayer: (layer: string | null) => void;
  resetLayers: () => void;
  resetRarityUIStore: () => void;
}
