import { create } from 'zustand';

interface Layer {
  id: string;
  name: string;
  image: string;
  order: number;
  visible: boolean;
}

interface LayerOrderState {
  currentLayers: Layer[];
  setCurrentLayers: (layers: Layer[]) => void;
  updateLayerVisibility: (layerId: string, visible: boolean) => void;
  updateLayerOrder: (layerId: string, newOrder: number) => void;
}

export const useLayerOrderStore = create<LayerOrderState>((set) => ({
  currentLayers: [],
  setCurrentLayers: (layers) => set({ currentLayers: layers }),
  updateLayerVisibility: (layerId, visible) =>
    set((state) => ({
      currentLayers: state.currentLayers.map((layer) =>
        layer.id === layerId ? { ...layer, visible } : layer
      ),
    })),
  updateLayerOrder: (layerId, newOrder) =>
    set((state) => ({
      currentLayers: state.currentLayers.map((layer) =>
        layer.id === layerId ? { ...layer, order: newOrder } : layer
      ),
    })),
}));
