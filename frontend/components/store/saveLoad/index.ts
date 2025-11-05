import { create } from 'zustand';

import { api } from '@/services';
import type { SaveLoadState, SaveLoadActions } from '@/types/stores';

import type {
  OrderedLayersSets,
  ImageSetupPersistentState,
  ProjectSetup as ProjectSetupPersistentState,
} from '@/types/effect';

import type { ProjectConfig } from './types';

import { useProjectSetupStore } from '@/components/store/projectSetup/main';
import { useLayerOrderStore } from '@/components/store/layerOrder/main';
import { useGenerationSettingsStore } from '@/components/store/generationsettings';
import { useUpdateStore } from '@/components/store/update';

export const useSaveLoadStore = create<SaveLoadState & SaveLoadActions>((set) => ({
  isSaving: false,
  isLoading: false,

  saveProjectConfig: async () => {
    set({ isSaving: true });

    try {
      const [projectSetup, layerOrder, incompatibilities, forcedCombinations, imageSetup] =
        await Promise.all([
          api.loadProjectSetup(),
          api.loadLayerOrderState(),
          api.loadIncompatibilityState(),
          api.loadForcedCombinationState(),
          api.loadImageSetupState(),
        ]);

      const { targetBlockchain } = useUpdateStore.getState();
      const rarityConfig = await api.loadRarityConfig();

      const config: ProjectConfig = {
        collectionName: projectSetup?.collectionName ?? '',
        collectionDescription: projectSetup?.collectionDescription ?? '',
        selectedFolder: projectSetup?.selectedFolder ?? '',
        exportFolder: projectSetup?.exportFolder ?? '',
        sets: layerOrder?.sets ?? {},
        activeSetId: layerOrder?.activeSetId ?? 'set1',
        orderedLayersSets: {},
        activeSet: layerOrder?.activeSetId ?? 'set1',
        rarityConfig: rarityConfig ?? {},
        baseWidth: imageSetup?.baseWidth ?? 0,
        baseHeight: imageSetup?.baseHeight ?? 0,
        finalWidth: imageSetup?.finalWidth ?? 0,
        finalHeight: imageSetup?.finalHeight ?? 0,
        fixedProportion: imageSetup?.fixedProportion ?? false,
        imageFormat: imageSetup?.imageFormat ?? 'png',
        incompatibilitiesBySets: incompatibilities ?? {},
        forcedCombinationsBySets: forcedCombinations ?? {},
        targetBlockchain: targetBlockchain ?? 'ethereum',
        includeRarity: projectSetup?.includeRarity,
        maxFrames: projectSetup?.maxFrames,
        isAnimatedCollection: projectSetup?.isAnimatedCollection,
        spritesheetLayout: projectSetup?.spritesheetLayout,
        projectId: projectSetup?.projectId,
        availableSets: layerOrder?.sets
          ? Object.keys(layerOrder.sets)
              .map((setId) => parseInt(setId.replace('set', '')))
              .filter((num) => !isNaN(num))
              .sort((a, b) => a - b)
          : [1],
        includeSpritesheets: imageSetup?.includeSpritesheets,
        allowDuplicates: imageSetup?.allowDuplicates,
        shuffleSets: imageSetup?.shuffleSets,
        blockchain: imageSetup?.blockchain,
        solanaConfig: imageSetup?.solanaConfig,
        animationQuality: imageSetup?.animationQuality,
        resizeConfig: imageSetup?.resizeConfig,
      };

      if (layerOrder?.sets && Object.keys(layerOrder.sets).length > 0) {
        const orderedLayersSets: OrderedLayersSets = {};
        Object.entries(layerOrder.sets).forEach(([setId, setInfo]) => {
          orderedLayersSets[setId] = {
            id: setId,
            name: setInfo.name || `Set ${setId.replace('set', '')}`,
            createdAt: setInfo.createdAt || new Date().toISOString(),
            layers: setInfo.layers,
            nftCount: setInfo.nftCount,
            customName: setInfo.customName ?? undefined,
          };
        });
        config.orderedLayersSets = orderedLayersSets;
      }

      const result = await api.saveProjectConfig(config);
      if (!result.success) {
        console.error('Failed to save project configuration:', result.message);
      }
    } catch (error) {
      console.error('Error saving project configuration:', error);
    } finally {
      set({ isSaving: false });
    }
  },

  loadProjectConfig: async () => {
    set({ isLoading: true });

    try {
      const result = await api.loadProjectConfig();
      if (result.success && result.config) {
        const safeConfig = result.config;
        const projectSetupData: ProjectSetupPersistentState = {
          collectionName: safeConfig.collectionName,
          collectionDescription: safeConfig.collectionDescription,
          selectedFolder: safeConfig.selectedFolder,
          exportFolder: safeConfig.exportFolder,
          includeRarity: safeConfig.includeRarity ?? true,
          maxFrames: safeConfig.maxFrames ?? 0,
          isAnimatedCollection: safeConfig.isAnimatedCollection ?? false,
          spritesheetLayout: safeConfig.spritesheetLayout,
          projectId: safeConfig.projectId ?? safeConfig.selectedFolder?.split('/').pop() ?? '',
        };

        const imageSetupData: ImageSetupPersistentState = {
          baseWidth: safeConfig.baseWidth,
          baseHeight: safeConfig.baseHeight,
          finalWidth: safeConfig.finalWidth,
          finalHeight: safeConfig.finalHeight,
          fixedProportion: safeConfig.fixedProportion,
          imageFormat: safeConfig.imageFormat,
          includeSpritesheets: safeConfig.includeSpritesheets ?? false,
          allowDuplicates: safeConfig.allowDuplicates ?? false,
          shuffleSets: safeConfig.shuffleSets ?? false,
          blockchain: safeConfig.blockchain ?? 'eth',
          solanaConfig: safeConfig.solanaConfig ?? {
            symbol: '',
            sellerFeeBasisPoints: 500,
            externalUrl: '',
            creators: [],
          },
          animationQuality: safeConfig.animationQuality ?? undefined,
          resizeConfig: safeConfig.resizeConfig ?? undefined,
        };

        await Promise.all([
          api.saveProjectSetup(projectSetupData),

          (async () => {
            if (safeConfig.sets && safeConfig.activeSetId) {
              await api.saveLayerOrderState({
                sets: safeConfig.sets,
                activeSetId: safeConfig.activeSetId,
                setOrders: safeConfig.setOrders ?? [],
              });
            } else if (safeConfig.orderedLayersSets) {
              const sets: Record<
                string,
                {
                  id: string;
                  name: string;
                  customName?: string;
                  createdAt: string;
                  layers: string[];
                  nftCount: number;
                }
              > = {};

              Object.entries(safeConfig.orderedLayersSets).forEach(([setId, setInfo]) => {
                sets[setId] = {
                  id: setId,
                  name: setInfo.customName ?? `Set ${setId.replace('set', '')}`,
                  customName: setInfo.customName ?? undefined,
                  createdAt: new Date().toISOString(),
                  layers: setInfo.layers ?? [],
                  nftCount: setInfo.nftCount ?? 10,
                };
              });

              await api.saveLayerOrderState({
                sets,
                activeSetId: safeConfig.activeSet ?? 'set1',
                setOrders: safeConfig.setOrders ?? [],
              });
            }
          })(),

          api.saveRarityConfig(safeConfig.rarityConfig ?? {}),

          api.saveIncompatibilityState(safeConfig.incompatibilitiesBySets ?? {}),
          api.saveForcedCombinationState(safeConfig.forcedCombinationsBySets ?? {}),

          api.saveImageSetupState(imageSetupData),
        ]);

        useProjectSetupStore.setState({
          ...projectSetupData,
          showContent: true,
          errorMessage: undefined,
        });

        const orderedLayersSets = safeConfig.orderedLayersSets ?? {};
        let _activeSet = safeConfig.activeSet ?? 'set1';

        if (Object.keys(orderedLayersSets).length === 0 && safeConfig.sets) {
          Object.entries(safeConfig.sets).forEach(([setId, setInfo]) => {
            orderedLayersSets[setId] = {
              id: setId,
              name: setInfo.name || `Set ${setId.replace('set', '')}`,
              createdAt: setInfo.createdAt || new Date().toISOString(),
              layers: setInfo.layers || [],
              nftCount: setInfo.nftCount ?? 10,
              customName: setInfo.customName ?? undefined,
            };
          });
          _activeSet = safeConfig.activeSetId ?? 'set1';
        }

        const normalizedSets = {};
        if (safeConfig.sets) {
          Object.entries(safeConfig.sets).forEach(([setId, setInfo]) => {
            normalizedSets[setId] = {
              ...setInfo,
              customName: setInfo.customName ?? setInfo.name ?? `Set ${setId.replace('set', '')}`,
            };
          });
        }

        useLayerOrderStore.setState({
          sets: normalizedSets,
          activeSetId: safeConfig.activeSetId ?? 'set1',
          rarityConfig: safeConfig.rarityConfig ?? {},
        });

        useGenerationSettingsStore.setState({
          ...imageSetupData,
          isFormatOpen: false,
          errorMessage: null,
          isGenerateDisabled: false,
          imageFormats: safeConfig.isAnimatedCollection
            ? ['mp4', 'webp', 'webm', 'gif']
            : ['png', 'jpg', 'webp'],
        });

        useUpdateStore.setState({
          targetBlockchain: safeConfig.targetBlockchain ?? 'ethereum',
        });
      } else {
        console.error('Failed to load project configuration:', result.message);
      }
    } catch (error) {
      console.error('Error loading project configuration:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
