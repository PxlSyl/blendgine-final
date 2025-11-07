import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { join, normalize } from '@tauri-apps/api/path';
import { Effect } from 'effect';
import { LayerContent } from '../types/stores';
import { ProjectConfig } from '@/components/store/saveLoad/types';

import { DialogOptions, FolderContent, NFTProgressInfo, TauriApi } from './types';
import {
  ProjectSetupState,
  ProjectSetup as ProjectSetupPersistentState,
  InitialFolderData,
  RarityConfig,
  TintingOptions,
  NFTGenerationArgs,
  FlipOptions,
  IncompatibilitiesBySets,
  ForcedCombinationsBySets,
  SpritesheetLayout,
  Preferences,
  SetInfo,
} from '../types/effect';
import {
  ImageSetupPersistentState,
  ImageSetupState,
} from '../components/store/generationsettings/types';

export class TauriApiService implements TauriApi {
  private static instance: TauriApiService | null = null;

  public static getInstance(): TauriApiService {
    TauriApiService.instance ??= new TauriApiService();
    return TauriApiService.instance;
  }

  async setTheme(darkMode: boolean): Promise<void> {
    await invoke('set_theme', { darkMode });
  }

  async selectFolder(): Promise<string> {
    return await invoke<string>('select_folder');
  }

  async renameItem(
    basePath: string,
    oldName: string,
    newName: string
  ): Promise<{ success: boolean; error?: string }> {
    return await invoke<{ success: boolean; error?: string }>('rename_item', {
      basePath,
      oldName,
      newName,
    });
  }

  async closeWindow(): Promise<void> {
    await invoke('close_window');
  }

  async selectAndLoadFolderData(): Promise<InitialFolderData | null> {
    const result = await invoke<InitialFolderData | null>('select_and_load_folder_data');
    return result;
  }

  async selectExportFolder(): Promise<string> {
    return await invoke<string>('select_export_folder');
  }

  async getLayersContent(folderPath: string): Promise<LayerContent[]> {
    return await invoke<LayerContent[]>('get_layers_content', { folderPath });
  }

  async startNFTGeneration(
    args: NFTGenerationArgs
  ): Promise<{ success: boolean; message: string }> {
    return await invoke<{ success: boolean; message: string }>('start_nft_generation', { args });
  }

  async getCacheStats(folderPath: string): Promise<{ count: number; size: number } | null> {
    return await invoke<{ count: number; size: number } | null>('get_cache_stats', {
      folderPath,
    });
  }

  async getLayerImageNames(folderPath: string, layerName: string): Promise<string[]> {
    return await invoke<string[]>('get_layer_image_names', { folderPath, layerName });
  }

  async getLayerImagePath(
    folderPath: string,
    layerName: string,
    imageName: string
  ): Promise<string> {
    return await invoke<string>('get_layer_image_path', { folderPath, layerName, imageName });
  }

  async getSpriteSheetImagePath(
    projectId: string,
    layerTraitPath: string,
    spritesheetName: string
  ): Promise<string> {
    return await invoke<string>('get_spritesheet_image_path', {
      projectId,
      layerTraitPath,
      spritesheetName,
    });
  }

  async cancelNFTGeneration(): Promise<{ success: boolean; message: string }> {
    return await invoke<{ success: boolean; message: string }>('cancel_nft_generation');
  }

  onNFTGenerationProgress(callback: (progressInfo: NFTProgressInfo) => void): () => void {
    let cancelled = false;

    const processingListenerPromise = listen<NFTProgressInfo>(
      'nft-generation-progress',
      (event) => {
        if (!cancelled) {
          callback({
            currentCount: event.payload.currentCount,
            totalCount: event.payload.totalCount,
            estimatedCount: event.payload.estimatedCount,
            sequenceNumber: event.payload.sequenceNumber,
            currentImage: {
              path: event.payload.currentImage?.path,
              name: event.payload.currentImage?.name,
              traits: event.payload.currentImage?.traits,
            },
          });
        }
      }
    );

    return () => {
      cancelled = true;
      processingListenerPromise
        .then((processingListener) => {
          if (!cancelled && typeof processingListener === 'function') {
            processingListener();
          }
        })
        .catch(() => {
          // Silent fail for race conditions
        });
    };
  }

  async toggleGenerationPause(isPaused: boolean): Promise<{ success: boolean; message: string }> {
    const effect = Effect.tryPromise({
      try: () =>
        invoke<{ success: boolean }>('toggle_generation_pause', {
          isPaused,
        }),
      catch: (error) => {
        console.error('Error toggling generation pause:', error);
        return {
          success: false,
          message: `Failed to ${isPaused ? 'pause' : 'resume'} generation`,
        };
      },
    });

    const result = await Effect.runPromise(effect);
    if (!result.success) {
      return {
        success: false,
        message: `Failed to ${isPaused ? 'pause' : 'resume'} generation`,
      };
    }
    return {
      success: true,
      message: isPaused ? 'Generation paused' : 'Generation resumed',
    };
  }

  onNFTGenerationCancelled(callback: () => void): () => void {
    let cancelled = false;

    const processingListenerPromise = listen('nft-generation-cancelled', () => {
      if (!cancelled) {
        callback();
      }
    });

    return () => {
      cancelled = true;
      processingListenerPromise
        .then((processingListener) => {
          if (!cancelled && typeof processingListener === 'function') {
            processingListener();
          }
        })
        .catch(() => {
          // Silent fail for race conditions
        });
    };
  }

  async isFolderEmpty(folderPath: string): Promise<boolean> {
    return await invoke<boolean>('is_folder_empty', { folderPath });
  }

  async getBaseDimensions(
    folderPath: string,
    firstLayer: string
  ): Promise<{ width: number; height: number }> {
    return await invoke<{ width: number; height: number }>('get_base_dimensions', {
      folderPath,
      firstLayer,
    });
  }

  async quit(): Promise<void> {
    return await invoke<void>('quit');
  }

  async checkFolderExists(path: string): Promise<boolean> {
    return await invoke<boolean>('check_folder_exists', { path });
  }

  async selectSourceFolder(): Promise<string | null> {
    const result = await invoke<string>('select_source_folder');
    return result;
  }

  async selectDestinationFolder(): Promise<string | null> {
    const result = await invoke<string>('select_destination_folder');
    return result;
  }

  registerProgressListener(): () => void {
    void (async () => {
      await invoke('register_progress_listener');
    })();

    return () => {
      void (async () => {
        try {
          await this.unregisterProgressListener();
        } catch (error) {
          console.error('Error unregistering progress listener:', error);
        }
      })();
    };
  }

  async unregisterProgressListener(): Promise<void> {
    await invoke('unregister_progress_listener');
  }

  async cleanPreviewsFolder(exportPath: string): Promise<{ success: boolean; error?: string }> {
    await invoke<void>('clean_previews_folder', { exportPath });
    return { success: true };
  }

  async deleteFile(filePath: string): Promise<{ success: boolean; error?: string }> {
    return await invoke<{ success: boolean; error?: string }>('delete_file', { filePath });
  }

  async updateFlipOptions(options: FlipOptions): Promise<void> {
    await invoke<void>('update_flip_options', { options });
  }

  async getFlipOptions(): Promise<FlipOptions> {
    return await invoke<FlipOptions>('get_flip_options');
  }

  async saveFilterState(state: {
    sourceFolder: string;
    destinationFolder: string;
    hasUserSelectedFolders: boolean;
    flipOptions: FlipOptions;
    tintingOptions: TintingOptions;
    selectedPaletteName: string;
    lastAdjustmentMade: boolean;
    exportFormat: string;
    isAnimated: boolean;
  }): Promise<void> {
    await invoke<void>('save_filter_state', { state });
  }

  async loadFilterState(): Promise<{
    sourceFolder: string;
    destinationFolder: string;
    hasUserSelectedFolders: boolean;
    flipOptions: FlipOptions;
    tintingOptions: TintingOptions;
    selectedPaletteName: string;
    lastAdjustmentMade: boolean;
    exportFormat: string;
    isAnimated: boolean;
  }> {
    return await invoke<{
      sourceFolder: string;
      destinationFolder: string;
      hasUserSelectedFolders: boolean;
      flipOptions: FlipOptions;
      tintingOptions: TintingOptions;
      selectedPaletteName: string;
      lastAdjustmentMade: boolean;
      exportFormat: string;
      isAnimated: boolean;
    }>('load_filter_state');
  }

  async mixLegendaryNFTs(legendaryFolder: string, exportFolder: string): Promise<void> {
    await invoke<void>('mix_legendary_nfts', { legendaryFolder, exportFolder });
  }

  async selectLegendaryNFTsFolder(): Promise<string | null> {
    return await invoke<string | null>('select_legendary_nfts_folder');
  }

  async validateLegendaryNFTsFolder(folderPath: string): Promise<{
    isValid: boolean;
    errorMessage?: string;
  }> {
    return await invoke<{ isValid: boolean; errorMessage?: string }>(
      'validate_legendary_nfts_folder',
      { folderPath }
    );
  }

  async readFolder(folderPath: string): Promise<FolderContent> {
    return await invoke<FolderContent>('read_folder', { folderPath });
  }

  async saveProjectSetup(state: ProjectSetupPersistentState): Promise<void> {
    await invoke<void>('save_projectsetup_state', { state });
  }

  async loadProjectSetup(): Promise<ProjectSetupState> {
    return await invoke<ProjectSetupState>('load_projectsetup_state');
  }

  async validateAndReloadLayers(folderPath: string): Promise<InitialFolderData> {
    return await invoke<InitialFolderData>('validate_and_reload_layers', { folderPath });
  }

  async saveLayerOrderState(state: {
    sets: Record<
      string,
      {
        id: string;
        name: string;
        customName?: string;
        createdAt: string;
        layers: string[];
        nftCount: number;
      }
    >;
    activeSetId: string;
    setOrders: Array<{ id: string; order: number }>;
  }): Promise<void> {
    await invoke<void>('save_layer_order_state', { state });
  }

  async loadLayerOrderState(): Promise<{
    sets: Record<
      string,
      {
        id: string;
        name: string;
        customName?: string;
        createdAt: string;
        layers: string[];
        nftCount: number;
      }
    >;
    activeSetId: string;
    setOrders: Array<{ id: string; order: number }>;
  }> {
    return await invoke<{
      sets: Record<
        string,
        {
          id: string;
          name: string;
          customName?: string;
          createdAt: string;
          layers: string[];
          nftCount: number;
        }
      >;
      activeSetId: string;
      setOrders: Array<{ id: string; order: number }>;
    }>('load_layer_order_state');
  }

  async saveIncompatibilityState(state: IncompatibilitiesBySets): Promise<void> {
    await invoke<void>('save_incompatibility_state', { state });
  }

  async loadIncompatibilityState(): Promise<IncompatibilitiesBySets> {
    return await invoke<IncompatibilitiesBySets>('load_incompatibility_state');
  }

  async loadForcedCombinationState(): Promise<ForcedCombinationsBySets> {
    return await invoke<ForcedCombinationsBySets>('load_forced_combination_state');
  }

  async saveForcedCombinationState(state: ForcedCombinationsBySets): Promise<void> {
    await invoke<void>('save_forced_combination_state', { state });
  }

  async saveImageSetupState(state: ImageSetupPersistentState): Promise<void> {
    await invoke<void>('save_image_setup_state', { state });
  }

  async loadImageSetupState(): Promise<ImageSetupState> {
    return await invoke<ImageSetupState>('load_image_setup_state');
  }

  async saveRarityConfig(config: RarityConfig): Promise<void> {
    await invoke<void>('save_rarity_config', { config });
  }

  async loadRarityConfig(): Promise<RarityConfig> {
    return await invoke<RarityConfig>('load_rarity_config');
  }

  async saveSingleJsonFileDialog(
    data: object,
    defaultFilePath?: string
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    const result = await invoke<string>('save_single_json_file_dialog', {
      data,
      defaultFilePath,
    });
    return { success: true, filePath: result };
  }

  async isFolderModified(folderPath: string, previousHash: string): Promise<boolean> {
    return await invoke<boolean>('is_folder_modified', { folderPath, previousHash });
  }

  async getPreviousHash(folderPath: string): Promise<string> {
    const result = await invoke<string | null>('get_previous_hash', { folderPath });
    if (result === null) {
      return '';
    }
    return result;
  }

  async calculateFolderHash(folderPath: string): Promise<string> {
    return await invoke<string>('calculate_folder_hash', { folderPath });
  }

  async saveFolderHash(folderPath: string, hash: string): Promise<void> {
    await invoke<void>('save_folder_hash', { folderPath, hash });
  }

  async readLayers(folderPath: string): Promise<string[]> {
    return await invoke<string[]>('read_layers', { folderPath });
  }

  async readTraits(folderPath: string, layerName: string): Promise<string[]> {
    return await invoke<string[]>('read_traits', {
      folderPath,
      layerName,
    });
  }

  async saveProjectConfig(config: ProjectConfig): Promise<{ success: boolean; message: string }> {
    return await invoke<{ success: boolean; message: string }>('save_project_config', {
      config,
    });
  }

  async loadProjectConfig(): Promise<{
    success: boolean;
    message: string;
    config?: ProjectConfig;
  }> {
    return await invoke<{
      success: boolean;
      message: string;
      config?: ProjectConfig;
    }>('load_project_config');
  }

  async getDocumentsPath(): Promise<string> {
    return await invoke<string>('get_documents_path');
  }

  async showDialog(options: DialogOptions): Promise<void> {
    await invoke('show_dialog', { options });
  }

  async checkAnimatedImages(folderPath: string): Promise<boolean> {
    return await invoke<boolean>('check_animated_images', { folderPath });
  }

  async createDirectory(path: string): Promise<void> {
    await invoke<void>('create_directory', { path });
  }

  async saveFrame(framePath: string, frameData: string): Promise<void> {
    await invoke<void>('save_frame', { framePath, frameData });
  }

  async copyFile(sourcePath: string, destinationPath: string): Promise<void> {
    try {
      const normalizedSourcePath = await normalize(sourcePath);
      const normalizedDestPath = await normalize(destinationPath);

      const sourceExists = await this.fileExists(normalizedSourcePath);
      if (!sourceExists) {
        throw new Error(`Source file not found: ${sourcePath}`);
      }

      await invoke<void>('copy_file', {
        sourcePath: normalizedSourcePath,
        destinationPath: normalizedDestPath,
      });
    } catch (error) {
      console.error('Copy file error:', error);
      throw error;
    }
  }

  async fileExists(path: string): Promise<boolean> {
    try {
      await invoke<void>('check_file_exists', { path });
      return true;
    } catch {
      return false;
    }
  }

  async getFramesPath(projectId: string): Promise<string> {
    return await invoke('get_frames_path', { projectId });
  }

  async getSpritesheetsPath(projectId: string): Promise<string> {
    return await invoke('get_spritesheets_path', { projectId });
  }

  async cleanupProjectFrames(projectId: string): Promise<void> {
    return await invoke('cleanup_project_frames', { projectId });
  }

  async joinPaths(...paths: string[]): Promise<string> {
    return await join(...paths);
  }

  async getSpriteSheetMetadata(): Promise<SpritesheetLayout> {
    return await invoke<SpritesheetLayout>('get_spritesheet_metadata');
  }

  async loadPreferences(): Promise<Preferences> {
    try {
      return await invoke('load_preferences');
    } catch (err) {
      console.error('Failed to load preferences:', err);
      return { dark_mode: false };
    }
  }

  async savePreferences(prefs: Preferences): Promise<void> {
    try {
      await invoke('save_preferences', { preferences: prefs });
    } catch (err) {
      console.error('Failed to save preferences:', err);
    }
  }

  async getTheme(): Promise<boolean> {
    try {
      return await invoke('get_theme');
    } catch (err) {
      console.error('Failed to get theme:', err);
      return false;
    }
  }

  async setColorTheme(themeName: string): Promise<void> {
    try {
      await invoke('set_color_theme', { themeName });
    } catch (err) {
      console.error('Failed to set color theme:', err);
      throw err;
    }
  }

  async getColorTheme(): Promise<string> {
    try {
      return await invoke('get_color_theme');
    } catch (err) {
      console.error('Failed to get color theme:', err);
      return 'purple-pink-blue';
    }
  }

  async checkGpuAvailability(): Promise<{ available: boolean; error?: string }> {
    try {
      return await invoke('check_gpu_availability');
    } catch (err) {
      console.error('Failed to check GPU availability:', err);
      return { available: false, error: 'Failed to check GPU availability' };
    }
  }

  async getRarityData(
    layerName: string,
    traitName: string,
    setId: string
  ): Promise<{ rarity: number; globalRarity: number }> {
    return await invoke<{ rarity: number; globalRarity: number }>('get_rarity_data', {
      layerName,
      traitName,
      setId,
    });
  }

  async openLayersviewWindow(options: { layer_name: string; trait_name: string }): Promise<void> {
    await invoke('open_layersview_window', { options });
  }

  async closeLayersviewWindow(): Promise<void> {
    await invoke('close_layersview_window');
  }

  async isLayersviewWindowOpen(): Promise<boolean> {
    return await invoke<boolean>('is_layersview_window_open');
  }

  async getAllAvailableLayersAndTraits(): Promise<{
    layers: string[];
    traitsByLayer: Record<string, string[]>;
  }> {
    return await invoke<{ layers: string[]; traitsByLayer: Record<string, string[]> }>(
      'get_all_available_layers_and_traits'
    );
  }

  async isShortcutsWindowOpen(): Promise<boolean> {
    return await invoke<boolean>('is_shortcuts_window_open');
  }

  async closeShortcutsWindow(): Promise<void> {
    await invoke('close_shortcuts_window');
  }

  async openShortcutsWindow(): Promise<void> {
    await invoke('open_shortcuts_window');
  }

  onShortcutsWindowClosed(callback: () => void): () => void {
    let cancelled = false;

    const processingListenerPromise = listen('shortcuts-window-closed', () => {
      if (!cancelled) {
        callback();
      }
    });

    return () => {
      cancelled = true;
      processingListenerPromise
        .then((processingListener) => {
          if (!cancelled && typeof processingListener === 'function') {
            processingListener();
          }
        })
        .catch(() => {
          // Silent fail for race conditions
        });
    };
  }

  async isThemeColorsWindowOpen(): Promise<boolean> {
    return await invoke<boolean>('is_theme_colors_window_open');
  }

  async closeThemeColorsWindow(): Promise<void> {
    await invoke('close_theme_colors_window');
  }

  async openThemeColorsWindow(): Promise<void> {
    await invoke('open_theme_colors_window');
  }

  onThemeColorsWindowClosed(callback: () => void): () => void {
    let cancelled = false;

    const processingListenerPromise = listen('theme-colors-window-closed', () => {
      if (!cancelled) {
        callback();
      }
    });

    return () => {
      cancelled = true;
      processingListenerPromise
        .then((processingListener) => {
          if (!cancelled && typeof processingListener === 'function') {
            processingListener();
          }
        })
        .catch(() => {
          // Silent fail for race conditions
        });
    };
  }

  async isRulesWindowOpen(): Promise<boolean> {
    return await invoke<boolean>('is_rules_window_open');
  }

  async closeRulesWindow(): Promise<void> {
    await invoke('close_rules_window');
  }

  async openRulesWindow(options: { mode: string }): Promise<void> {
    await invoke('open_rules_window', { options });
  }

  async closeOffsetWindow(): Promise<void> {
    await invoke('close_offset_window');
  }

  onRulesWindowClosed(callback: () => void): () => void {
    let cancelled = false;

    const processingListenerPromise = listen('rules-window-closed', () => {
      if (!cancelled) {
        callback();
      }
    });

    return () => {
      cancelled = true;
      processingListenerPromise
        .then((processingListener) => {
          if (!cancelled && typeof processingListener === 'function') {
            processingListener();
          }
        })
        .catch(() => {
          // Silent fail for race conditions
        });
    };
  }

  async loadGlobalRarity(): Promise<{
    success: boolean;
    data?: Record<string, Record<string, number>>;
    error?: string;
  }> {
    const effect = Effect.tryPromise({
      try: () => invoke<Record<string, Record<string, number>>>('load_global_rarity'),
      catch: (error) => {
        console.error('Failed to load global rarity data:', error);
        return {
          success: false,
          error: 'Failed to load global rarity data',
        };
      },
    });

    const result = await Effect.runPromise(effect);
    return { success: true, data: result };
  }

  async saveGlobalRarity(data: Record<string, Record<string, number>>): Promise<{
    success: boolean;
    error?: string;
  }> {
    const effect = Effect.tryPromise({
      try: () => invoke('save_global_rarity', { data }),
      catch: (error) => {
        console.error('Failed to save global rarity data:', error);
        return {
          success: false,
          error: 'Failed to save global rarity data',
        };
      },
    });

    return Effect.runPromise(effect) as Promise<{ success: boolean; error?: string }>;
  }

  async updateGlobalRarityFromConfig(input: {
    rarityConfig: RarityConfig;
    sets: Record<string, SetInfo>;
  }): Promise<{
    success: boolean;
    error?: string;
  }> {
    const effect = Effect.tryPromise({
      try: () => invoke('update_global_rarity_from_config', { input }),
      catch: (error) => {
        console.error('Failed to update global rarity from config:', error);
        return {
          success: false,
          error: 'Failed to update global rarity from config',
        };
      },
    });

    return Effect.runPromise(effect) as Promise<{ success: boolean; error?: string }>;
  }
}

export const tauriApi = (() => {
  const effect = Effect.tryPromise({
    try: () => Promise.resolve(TauriApiService.getInstance()),
    catch: (error) => {
      console.error('Failed to initialize TauriApiService:', error);
      throw error;
    },
  });

  return Effect.runPromise(effect);
})();
