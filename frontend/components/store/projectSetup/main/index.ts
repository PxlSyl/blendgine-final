import { create } from 'zustand';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';

import { api } from '@/services';

import { DEFAULT_BLEND_PROPERTIES } from '@/types/blendModes';
import type { ProjectSetupState, ProjectSetup, BlendProperties } from '@/types/effect';
import type { ReadonlyLayerImages } from '../layerPreviewStore/types';
import { ProjectSetupActions, InputField } from './types';
import { ProjectSetupSchema } from '@/schemas/effect/projectSetup';
import * as S from '@effect/schema/Schema';

import { useLayerOrderStore } from '../../layerOrder/main';
import { useRarityStore } from '../../rarityStore/main';
import { useGenerationSettingsStore } from '../../generationsettings';
import { useLayerPreviewStore } from '../layerPreviewStore';
import { useFilterStore } from '../../filters/files';
import { usePreview3DStore } from '../../layerOrder/preview3Dstore';
import { usePreviewCanvasStore } from '../../layerOrder/previewCanvasStore';
import { useLegendaryNFTStore } from '../../legendary';
import { useRarityUIStore } from '../../rarityStore/rarityUIStore';
import { useColorStore } from '../../randomUI';
import { useIsSelectedStore } from './isSelectedStore';

import { removeFileExtension, resizeKeepingAspectRatio } from '../../../../utils/functionsUtils';
import { getDefaultZIndex, initializeLayerConfig } from './utils';
import { initialState } from './initialState';

export const useProjectSetupStore = create<ProjectSetupState & ProjectSetupActions>((set, get) => ({
  ...initialState,

  getInputFields: (): InputField[] => {
    const state = get();
    return [
      {
        label: 'Collection Name',
        value: state.collectionName,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
          state.handleCollectionNameChange(e.target.value),
        placeholder: 'Enter your collection name',
      },
      {
        label: 'Collection Description',
        value: state.collectionDescription,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
          state.handleCollectionDescriptionChange(e.target.value),
        placeholder: 'Describe your amazing NFT collection',
      },
    ];
  },

  loadPersistedState: async () => {
    const loadEffect = pipe(
      Effect.tryPromise(() => api.loadProjectSetup()),
      Effect.flatMap((loadedState) =>
        Effect.succeed({
          loadedState,
          isValid: loadedState && typeof loadedState === 'object',
        })
      ),
      Effect.flatMap(({ loadedState, isValid }) =>
        Effect.succeed({
          loadedState,
          isValid,
          validatedData: isValid
            ? S.decodeSync(ProjectSetupSchema)({
                collectionName: loadedState.collectionName || initialState.collectionName,
                collectionDescription:
                  loadedState.collectionDescription || initialState.collectionDescription,
                selectedFolder: loadedState.selectedFolder || initialState.selectedFolder,
                exportFolder: loadedState.exportFolder || initialState.exportFolder,
                includeRarity: loadedState.includeRarity || initialState.includeRarity,
                maxFrames: loadedState.maxFrames || initialState.maxFrames,
                isAnimatedCollection:
                  loadedState.isAnimatedCollection || initialState.isAnimatedCollection,
                spritesheetLayout:
                  loadedState.spritesheetLayout === null
                    ? undefined
                    : loadedState.spritesheetLayout,
                projectId: loadedState.projectId,
              })
            : null,
        })
      ),
      Effect.flatMap(({ loadedState, isValid, validatedData }) =>
        Effect.succeed({
          loadedState: isValid
            ? {
                ...initialState,
                ...(validatedData ?? {
                  collectionName: loadedState.collectionName ?? initialState.collectionName,
                  collectionDescription:
                    loadedState.collectionDescription ?? initialState.collectionDescription,
                  selectedFolder: loadedState.selectedFolder ?? initialState.selectedFolder,
                  exportFolder: loadedState.exportFolder ?? initialState.exportFolder,
                  includeRarity: loadedState.includeRarity ?? initialState.includeRarity,
                  maxFrames: loadedState.maxFrames ?? initialState.maxFrames,
                  isAnimatedCollection:
                    loadedState.isAnimatedCollection ?? initialState.isAnimatedCollection,
                  spritesheetLayout:
                    loadedState.spritesheetLayout === null
                      ? undefined
                      : loadedState.spritesheetLayout,
                  projectId: loadedState.projectId ?? initialState.projectId,
                }),
                errorMessage: loadedState.errorMessage ?? undefined,
                showContent: loadedState.showContent ?? false,
              }
            : { ...initialState },
        })
      ),
      Effect.flatMap(({ loadedState }) =>
        loadedState.selectedFolder
          ? Effect.flatMap(
              Effect.tryPromise(() => api.checkFolderExists(loadedState.selectedFolder)),
              (folderExists) =>
                Effect.succeed({
                  loadedState,
                  folderExists,
                })
            )
          : Effect.succeed({
              loadedState,
              folderExists: false,
            })
      ),
      Effect.flatMap(({ loadedState, folderExists }) =>
        Effect.succeed({
          loadedState: folderExists
            ? {
                ...loadedState,
                selectedFolder: loadedState.selectedFolder,
                projectId: loadedState.projectId,
              }
            : {
                ...loadedState,
                selectedFolder: '',
                projectId: undefined,
              },
        })
      ),
      Effect.flatMap(({ loadedState }) =>
        Effect.tryPromise(async () => {
          if (loadedState.selectedFolder) {
            set({
              ...loadedState,
              showContent: false,
              errorMessage: undefined,
            });

            const previewStore = useLayerPreviewStore.getState();

            await previewStore.resetLayerPreviewStore();

            await new Promise((resolve) => setTimeout(resolve, 0));

            if (loadedState.projectId) {
              previewStore.setProjectId(loadedState.projectId);
            }

            await get().validateAndReloadLayers(loadedState.selectedFolder);

            const layerOrderStore = useLayerOrderStore.getState();
            if (!layerOrderStore.sets['set1']?.layers?.length) {
              throw new Error('Failed to load layers');
            }

            const { layerImages } = previewStore;
            if (!layerImages.length) {
              throw new Error('Failed to load images');
            }

            set({ showContent: true });
          } else {
            set({ ...loadedState, showContent: true });
          }
        })
      ),
      Effect.catchAll((error) =>
        Effect.succeed(() => {
          console.error('Failed to load project configuration from backend:', error);
          set({ ...initialState, showContent: true });
        })
      )
    );

    await Effect.runPromise(loadEffect);
  },

  validateAndReloadLayers: async (folderPath: string): Promise<void> => {
    const validateEffect = pipe(
      Effect.succeed(folderPath),
      Effect.flatMap((path) =>
        Effect.succeed({
          path,
          isValid: path && path.trim() !== '',
        })
      ),
      Effect.flatMap(({ path, isValid }) =>
        Effect.succeed({
          path,
          isValid,
          error: isValid ? undefined : 'Invalid folder path',
        })
      ),
      Effect.flatMap(({ isValid, error }) =>
        Effect.succeed(() => {
          if (!isValid) {
            set({
              ...get(),
              errorMessage: error,
            });
            throw new Error(error);
          }
        })
      ),
      Effect.flatMap(() => Effect.tryPromise(() => api.validateAndReloadLayers(folderPath))),
      Effect.map((apiResult) => ({
        result: apiResult,
        layerOrderStore: useLayerOrderStore.getState(),
      })),
      Effect.map(({ result, layerOrderStore }) => ({
        result,
        layerOrderStore,
        activeSetId: layerOrderStore.activeSetId ?? 'set1',
        currentSet: layerOrderStore.sets[layerOrderStore.activeSetId ?? 'set1'],
      })),
      Effect.map(({ result, layerOrderStore, activeSetId, currentSet }) => ({
        result,
        layerOrderStore,
        activeSetId,
        currentSet,
        existingOrder: currentSet?.layers ?? [],
      })),
      Effect.map(({ result, layerOrderStore, existingOrder }) => {
        if (existingOrder.length > 0) {
          const newLayers = [...existingOrder];
          result.layers.forEach((layer) => {
            if (!newLayers.includes(layer.name)) {
              newLayers.push(layer.name);
            }
          });
          layerOrderStore.setOrderedLayers(newLayers);
        } else {
          layerOrderStore.setOrderedLayers(result.layers.map((layer) => layer.name));
        }
        return { result };
      }),
      Effect.map(({ result }) => ({
        layerOrderStore: useLayerOrderStore.getState(),
        existingConfig: useLayerOrderStore.getState().rarityConfig,
        result,
      })),
      Effect.map(({ layerOrderStore, existingConfig, result }) => {
        if (!existingConfig || Object.keys(existingConfig).length === 0) {
          const rarityConfig = {};

          if (Object.keys(layerOrderStore.sets).length === 0) {
            layerOrderStore.addSet();
          }

          for (let i = 0; i < result.layers.length; i++) {
            const layer = result.layers[i];

            rarityConfig[layer.name] = {
              traits: layer.images.reduce(
                (traits, img) => {
                  const traitName = removeFileExtension(img.name);
                  traits[traitName] = {
                    sets: Object.keys(layerOrderStore.sets).reduce(
                      (sets, setId) => {
                        sets[setId] = {
                          value: 100 / layer.images.length,
                          blend: { ...DEFAULT_BLEND_PROPERTIES },
                          enabled: true,
                          zIndex: getDefaultZIndex(layer.name, setId),
                        };
                        return sets;
                      },
                      {} as Record<
                        string,
                        { value: number; blend: BlendProperties; enabled: boolean; zIndex: number }
                      >
                    ),
                  };
                  return traits;
                },
                {} as Record<
                  string,
                  {
                    sets: Record<
                      string,
                      { value: number; blend: BlendProperties; enabled: boolean; zIndex: number }
                    >;
                  }
                >
              ),
              defaultBlend: { ...DEFAULT_BLEND_PROPERTIES },
              sets: Object.keys(layerOrderStore.sets).reduce(
                (sets, setId) => {
                  sets[setId] = { active: true };
                  return sets;
                },
                {} as Record<string, { active: boolean }>
              ),
            };
          }
          layerOrderStore.setRarityConfig(rarityConfig);
        }
        return { result };
      }),
      Effect.map(({ result }) => ({
        previewStore: useLayerPreviewStore.getState(),
        result,
      })),
      Effect.map(({ previewStore, result }) => {
        const { is_animated_collection, layers, frame_count, spritesheet_layout } = result;
        if (!is_animated_collection) {
          const BATCH_SIZE = 10;
          const totalLayers = layers.length;
          const allLayerImages: ReadonlyLayerImages[] = [];

          for (let i = 0; i < totalLayers; i += BATCH_SIZE) {
            const batch = layers.slice(i, i + BATCH_SIZE);
            const batchLayerImages = batch.map((layer) => {
              return {
                layerName: layer.name,
                imageNames: layer.images.map((img) => img.name),
                blendProperties: {} as Record<string, BlendProperties>,
                hasAnimatedImages: layer.has_animated_images,
                framesProcessed: false,
              } as const;
            });

            allLayerImages.push(...batchLayerImages);
          }

          previewStore.setLayerImages(allLayerImages);
        } else {
          previewStore.setLayerImages(
            layers.map(
              (layer) =>
                ({
                  layerName: layer.name,
                  imageNames: layer.images.map((img) => img.name),
                  imageInfos: layer.images.map((img) => ({
                    name: img.name,
                    frame_count: img.frame_count,
                    is_single_frame: img.is_single_frame,
                  })),
                  blendProperties: {} as Record<string, BlendProperties>,
                  base_dimensions: layer.base_dimensions,
                  hasAnimatedImages: layer.has_animated_images,
                  framesProcessed: false,
                }) as const
            )
          );
        }

        set({
          selectedFolder: folderPath,
          isAnimatedCollection: is_animated_collection,
          maxFrames: frame_count || 0,
          spritesheetLayout: spritesheet_layout,
          errorMessage: undefined,
        });

        const generationStore = useGenerationSettingsStore.getState();
        if (result.base_dimensions?.width && result.base_dimensions?.height) {
          generationStore.setBaseDimensions(
            result.base_dimensions.width,
            result.base_dimensions.height
          );

          const resizedFinalDimensions = resizeKeepingAspectRatio(
            result.base_dimensions.width,
            result.base_dimensions.height
          );
          generationStore.setFinalDimensions(
            resizedFinalDimensions.width,
            resizedFinalDimensions.height
          );
        }

        return undefined;
      }),
      Effect.flatMap(() =>
        Effect.tryPromise(() => useLayerPreviewStore.getState().loadLayerImageNames())
      ),
      Effect.catchAll((error) =>
        Effect.succeed(() => {
          console.error('Error validating and reloading layers:', error);
          throw error;
        })
      )
    );

    await Effect.runPromise(validateEffect);
  },

  updateProjectSetup: (updates: Partial<ProjectSetupState>) => {
    const state = get();
    set({ ...state, ...updates });
    void Effect.runPromise(Effect.tryPromise(() => get().saveState()));
  },

  resetProjectSetup: () => {
    const resetEffect = Effect.gen(function* (_) {
      const rarityStore = useRarityStore.getState();
      const { resetColorStore } = useColorStore.getState();
      const { resetGenerationStore } = useGenerationSettingsStore.getState();
      const layerPreviewStore = useLayerPreviewStore.getState();
      const { resetFilterStore } = useFilterStore.getState();
      const { resetRarityUIStore } = useRarityUIStore.getState();
      const { resetPreview3DStore } = usePreview3DStore.getState();
      const { resetPreviewCanvasStore } = usePreviewCanvasStore.getState();
      const { resetLegendaryNFTStore } = useLegendaryNFTStore.getState();

      yield* _(
        Effect.tryPromise(() =>
          Promise.all([
            rarityStore.resetAll(),
            resetGenerationStore(),
            resetPreview3DStore(),
            resetPreviewCanvasStore(),
            resetRarityUIStore(),
            resetFilterStore(),
            resetColorStore(),
          ])
        )
      );

      yield* _(
        Effect.tryPromise(() =>
          Promise.all([api.saveIncompatibilityState({}), api.saveForcedCombinationState({})])
        )
      );

      layerPreviewStore.setLayerImages([]);
      resetLegendaryNFTStore();

      set({
        ...initialState,
        showContent: false,
      });

      yield* _(Effect.tryPromise(() => get().saveState()));
      set({ showContent: true });
    });

    void Effect.runPromise(
      pipe(
        resetEffect,
        Effect.catchAll((error) =>
          Effect.succeed(() => {
            console.error('Error resetting:', error);
            set({
              ...get(),
              errorMessage: `Reset error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
          })
        )
      )
    );
  },

  saveState: async () => {
    const saveEffect = Effect.gen(function* (_) {
      const state = get();
      const persistedData: ProjectSetup = {
        collectionName: state.collectionName,
        collectionDescription: state.collectionDescription,
        selectedFolder: state.selectedFolder,
        exportFolder: state.exportFolder,
        includeRarity: state.includeRarity,
        maxFrames: state.maxFrames,
        isAnimatedCollection: state.isAnimatedCollection,
        spritesheetLayout: state.spritesheetLayout,
        projectId: state.projectId,
      };

      yield* _(
        Effect.tryPromise({
          try: () =>
            Promise.resolve(() => {
              S.decodeSync(ProjectSetupSchema)(persistedData);
            }),
          catch: (error) => {
            console.warn('Invalid data to save:', error);
            return Promise.resolve();
          },
        })
      );

      yield* _(Effect.tryPromise(() => api.saveProjectSetup(persistedData)));
    });

    await Effect.runPromise(
      pipe(
        saveEffect,
        Effect.catchAll((error) =>
          Effect.succeed(() => {
            console.error('Error saving project setup:', error);
            set({
              ...get(),
              errorMessage: `Save error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
          })
        )
      )
    );
  },

  handleSelectFolder: async () => {
    const isSelectedStore = useIsSelectedStore.getState();
    isSelectedStore.setHasSelectedFolder(true);

    const selectFolderEffect = Effect.gen(function* (_) {
      const result = yield* _(Effect.tryPromise(() => api.selectAndLoadFolderData()));

      if (!result) {
        isSelectedStore.setHasSelectedFolder(false);
        return;
      }

      const currentFolder = get().selectedFolder;
      if (currentFolder === result.folder_path) {
        isSelectedStore.setHasSelectedFolder(false);
        return;
      }

      const isInvalidPath = result.folder_path.includes('@') || result.folder_path.includes('%40');
      if (isInvalidPath) {
        set({
          ...get(),
          errorMessage: "The folder path must not contain the '@' character.",
        });
        isSelectedStore.setHasSelectedFolder(false);
        return;
      }

      const layerOrderStore = useLayerOrderStore.getState();
      const rarityStore = useRarityStore.getState();
      const generationStore = useGenerationSettingsStore.getState();
      const previewStore = useLayerPreviewStore.getState();

      yield* _(
        Effect.tryPromise(() =>
          Promise.all([
            layerOrderStore.resetLayerOrderStore(),
            api.saveIncompatibilityState({}),
            api.saveForcedCombinationState({}),
          ])
        )
      );

      layerOrderStore.addSet();
      layerOrderStore.setActiveSet(1);
      layerOrderStore.initializeSetOrders();

      yield* _(Effect.tryPromise(() => new Promise((resolve) => setTimeout(resolve, 0))));

      const layerNames = result.layers.map((layer) => layer.name);
      layerOrderStore.setOrderedLayers(layerNames, 'set1');
      layerOrderStore.updateSetNFTCount('set1', 10);

      const initialConfig = {};
      result.layers.forEach((layer) => {
        initialConfig[layer.name] = initializeLayerConfig(
          layer.images.map((img) => removeFileExtension(img.name)),
          layer.name
        );
      });
      void rarityStore.setRarityConfig(initialConfig);

      previewStore.setLayerImages([]);
      const projectId = result.folder_path.split('/').pop() ?? '';
      previewStore.setProjectId(projectId);

      set({
        selectedFolder: result.folder_path,
        isAnimatedCollection: result.is_animated_collection,
        maxFrames: result.frame_count ?? 0,
        spritesheetLayout: result.spritesheet_layout ?? undefined,
        projectId,
      });

      previewStore.setLayerImages(
        result.layers.map((layer) => {
          return {
            layerName: layer.name,
            imageNames: layer.images.map((img) => img.name),
            imageInfos: layer.images.map((img) => ({
              name: img.name,
              frame_count: img.frame_count,
              is_single_frame: img.is_single_frame,
            })),
            blendProperties: {},
            base_dimensions: layer.base_dimensions,
            hasAnimatedImages: layer.has_animated_images,
            framesProcessed: false,
          };
        })
      );

      generationStore.setBaseDimensions(
        result.base_dimensions.width,
        result.base_dimensions.height
      );

      const resizedFinalDimensions = resizeKeepingAspectRatio(
        result.base_dimensions.width,
        result.base_dimensions.height
      );
      generationStore.setFinalDimensions(
        resizedFinalDimensions.width,
        resizedFinalDimensions.height
      );

      yield* _(Effect.tryPromise(() => previewStore.loadLayerImageNames()));

      yield* _(
        Effect.tryPromise(() =>
          api.saveProjectSetup({
            collectionName: get().collectionName,
            collectionDescription: get().collectionDescription,
            selectedFolder: get().selectedFolder,
            exportFolder: get().exportFolder,
            includeRarity: get().includeRarity,
            maxFrames: get().maxFrames,
            isAnimatedCollection: get().isAnimatedCollection,
            spritesheetLayout: get().spritesheetLayout,
            projectId: get().projectId,
          })
        )
      );
      set({ showContent: true });
      isSelectedStore.setHasSelectedFolder(false);
    });

    await Effect.runPromise(
      pipe(
        selectFolderEffect,
        Effect.catchAll((error) =>
          Effect.succeed(() => {
            console.error('Error in handleSelectFolder:', error);
            set({ errorMessage: String(error), showContent: true });
            const isSelectedStore = useIsSelectedStore.getState();
            isSelectedStore.setHasSelectedFolder(false);
          })
        )
      )
    );
  },

  handleSelectExportFolder: async () => {
    const selectExportFolderEffect = Effect.gen(function* (_) {
      const folder = yield* _(Effect.tryPromise(() => api.selectExportFolder()));

      if (!folder) {
        return;
      }

      const state = get();
      set({ ...state, exportFolder: folder });

      yield* _(Effect.tryPromise(() => get().saveState()));
    });

    await Effect.runPromise(
      pipe(
        selectExportFolderEffect,
        Effect.catchAll((error) =>
          Effect.succeed(() => {
            console.error('Error selecting export folder:', error);
            set({
              ...get(),
              errorMessage: `Export folder selection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
          })
        )
      )
    );
  },

  handleCollectionNameChange: (name: string) => {
    const updateEffect = Effect.gen(function* (_) {
      const state = get();
      set({ ...state, collectionName: name });
      yield* _(Effect.tryPromise(() => get().saveState()));
    });

    void Effect.runPromise(updateEffect);
  },

  handleCollectionDescriptionChange: (description: string) => {
    const updateEffect = Effect.gen(function* (_) {
      const state = get();
      set({ ...state, collectionDescription: description });
      yield* _(Effect.tryPromise(() => get().saveState()));
    });

    void Effect.runPromise(updateEffect);
  },

  setShowContent: (show: boolean) => {
    set({ showContent: show });
  },

  setErrorMessage: (message: string | null) => {
    set({ errorMessage: message ?? undefined });
  },

  setIncludeRarity: (include: boolean) => {
    get().updateProjectSetup({ includeRarity: include });
  },

  setMaxFrames: (frames: number) => {
    get().updateProjectSetup({ maxFrames: frames });
  },

  setSelectedFolder: (folder: string | null) => {
    set({ selectedFolder: folder ?? '' });
  },

  setIsAnimatedCollection: (value: boolean) => {
    set({ isAnimatedCollection: value });

    const generationSettingsStore = useGenerationSettingsStore.getState();
    generationSettingsStore.updateFormats();
  },
}));
