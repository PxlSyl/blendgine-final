import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

interface ZoomEffectsState {
  isWindowOpen: boolean;
  openZoomEffectsWindow: (filePath: string, title: string) => Promise<void>;
  closeZoomEffectsWindow: () => Promise<void>;
  checkWindowStatus: () => Promise<void>;
}

export const useZoomEffectsStore = create<ZoomEffectsState>((set) => ({
  isWindowOpen: false,
  openZoomEffectsWindow: async (filePath: string, title: string) => {
    try {
      await invoke('open_zoom_effects_window', {
        options: { file_path: filePath, title },
      });
      set({ isWindowOpen: true });
    } catch (error) {
      console.error('Failed to open zoom effects window:', error);
    }
  },
  closeZoomEffectsWindow: async () => {
    try {
      await invoke('close_zoom_effects_window');
      set({ isWindowOpen: false });
    } catch (error) {
      console.error('Failed to close zoom effects window:', error);
    }
  },
  checkWindowStatus: async () => {
    try {
      const isOpen = await invoke<boolean>('is_zoom_effects_window_open');
      set({ isWindowOpen: isOpen });
    } catch (error) {
      console.error('Failed to check zoom effects window status:', error);
    }
  },
}));
