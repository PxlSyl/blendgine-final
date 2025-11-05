import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

interface Layer {
  id: string;
  name: string;
  image: string;
  order: number;
  visible: boolean;
  isSpritesheet?: boolean;
  frameWidth?: number;
  frameHeight?: number;
  totalFrames?: number;
  spritesheetCols?: number;
  spritesheetRows?: number;
  opacity?: number;
  blendMode?: string;
}

interface LayerOrderZoomPayload {
  layers: Layer[];
  isAnimatedCollection: boolean;
  fps: number;
  maxFrames: number;
  currentFrame?: number;
}

interface LayerOrderZoomState {
  isWindowOpen: boolean;
  layers: Layer[];
  openLayerOrderZoomWindow: (payload: LayerOrderZoomPayload) => Promise<void>;
  closeLayerOrderZoomWindow: () => Promise<void>;
  checkWindowStatus: () => Promise<void>;
}

export const useLayerOrderZoomStore = create<LayerOrderZoomState>((set) => ({
  isWindowOpen: false,
  layers: [],
  openLayerOrderZoomWindow: async (payload: LayerOrderZoomPayload) => {
    try {
      const processedLayers = payload.layers.map((layer) => ({
        ...layer,
        opacity: layer.opacity ?? 1,
        blendMode: layer.blendMode ?? 'source-over',
      }));

      await invoke('open_layer_order_zoom_window', {
        options: {
          ...payload,
          layers: processedLayers,
        },
      });
      set({ isWindowOpen: true, layers: processedLayers });
    } catch (error) {
      console.error('Failed to open layer order zoom window:', error);
    }
  },
  closeLayerOrderZoomWindow: async () => {
    try {
      await invoke('close_layer_order_zoom_window');
      set({ isWindowOpen: false });
    } catch (error) {
      console.error('Failed to close layer order zoom window:', error);
    }
  },
  checkWindowStatus: async () => {
    try {
      const isOpen = await invoke<boolean>('is_layer_order_zoom_window_open');
      set({ isWindowOpen: isOpen });
    } catch (error) {
      console.error('Failed to check layer order zoom window status:', error);
    }
  },
}));
