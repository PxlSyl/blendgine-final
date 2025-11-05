import { create } from 'zustand';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';

import { api } from '@/services';

import type { ImageSetupState, ImageSetupActions, ImageSetupPersistentState } from './types';
import type { SolanaMetadataConfig, AnimationQualityConfig, ResizeConfig } from '@/types/effect';
import { DEFAULT_BLEND_PROPERTIES, VALID_BLEND_MODES, BlendMode } from '@/types/blendModes';

import { useLayerOrderStore } from '../layerOrder/main';
import { useRarityStore } from '../rarityStore/main';
import { useProjectSetupStore } from '../projectSetup/main';

export const getIsAnimated = () => {
  const projectSetupStore = useProjectSetupStore.getState();
  return projectSetupStore.isAnimatedCollection;
};

export const useGenerationSettingsStore = create<ImageSetupState & ImageSetupActions>(
  (set, get: () => ImageSetupState & ImageSetupActions) => {
    const initialState = {
      isFormatOpen: false,
      errorMessage: null,
      isGenerateDisabled: false,
      selectedFormat: '',
      imageFormats: [],
      blockchains: ['eth', 'sol'] as ('eth' | 'sol')[],

      imageFormat: '',
      baseWidth: 0,
      baseHeight: 0,
      finalWidth: 0,
      finalHeight: 0,
      fixedProportion: false,
      includeSpritesheets: false,
      allowDuplicates: false,
      shuffleSets: false,
      blockchain: 'eth' as const,
      solanaConfig: undefined,
      animationQuality: undefined,
      resizeConfig: undefined,
    };

    const loadInitialData = async () => {
      try {
        const backendState = await api.loadImageSetupState();
        if (backendState) {
          const isAnimated = getIsAnimated();
          const availableFormats = isAnimated
            ? ['mp4', 'webp', 'webm', 'gif']
            : ['png', 'jpg', 'webp'];

          const newState = {
            ...backendState,
            selectedFormat: backendState.imageFormat,
            imageFormat: backendState.imageFormat,
            imageFormats: availableFormats,
            errorMessage: null,
            isGenerateDisabled: false,
            isFormatOpen: false,
            blockchains: ['eth', 'sol'] as ('eth' | 'sol')[],
          };

          set(newState);
        }
      } catch (error) {
        console.error('Error loading initial data from backend:', error);
      }
    };

    void loadInitialData();

    return {
      ...initialState,

      resetGenerationStore: async () => {
        const resetEffect = pipe(
          Effect.tryPromise(() => {
            void loadInitialData();
            return get().saveState();
          }),
          Effect.catchAll((error) =>
            Effect.succeed(() => {
              console.error('Error resetting generation store:', error);
            })
          )
        );

        await Effect.runPromise(resetEffect);
      },

      getMaxImageSize: () => {
        return getIsAnimated() ? 1024 : 2048;
      },

      get MIN_IMAGE_SIZE() {
        return 12;
      },

      validateDimensions: () => {
        const { finalWidth, finalHeight } = get();
        const { MIN_IMAGE_SIZE } = get();
        const MAX_IMAGE_SIZE = get().getMaxImageSize();

        if (finalWidth < MIN_IMAGE_SIZE || finalHeight < MIN_IMAGE_SIZE) {
          set({
            errorMessage: `Error: Image dimensions must be at least ${MIN_IMAGE_SIZE}x${MIN_IMAGE_SIZE} pixels.`,
            isGenerateDisabled: true,
          });
          return false;
        }

        if (finalWidth > MAX_IMAGE_SIZE || finalHeight > MAX_IMAGE_SIZE) {
          set({
            errorMessage: `Error: Image dimensions cannot exceed ${MAX_IMAGE_SIZE}x${MAX_IMAGE_SIZE} pixels.`,
            isGenerateDisabled: true,
          });
          return false;
        }
        return true;
      },

      validateConfiguration: () => {
        const rarityStore = useRarityStore.getState();
        const rarityConfig = rarityStore.getRarityConfig();
        const layerOrderStore = useLayerOrderStore.getState();
        const allSets = Object.keys(layerOrderStore.sets);

        if (!rarityConfig) {
          set({
            errorMessage: `Error: Rarity configuration is missing.`,
            isGenerateDisabled: true,
          });
          return false;
        }

        for (const setId of allSets) {
          const activeLayerCount = Object.values(rarityConfig).filter(
            (layer) => layer.sets?.[setId]?.active
          ).length;

          if (activeLayerCount < 3) {
            set({
              errorMessage: `Error: Set "${setId}" needs at least three active traits.`,
              isGenerateDisabled: true,
            });
            return false;
          }

          const invalidLayers = Object.keys(rarityConfig).filter(
            (layer) =>
              rarityConfig[layer].sets?.[setId]?.active &&
              !rarityStore.validateLayerProbabilities(layer)
          );

          if (invalidLayers.length > 0) {
            set({
              errorMessage: `Error: Invalid probabilities in set "${setId}" for layers: ${invalidLayers.join(', ')}`,
              isGenerateDisabled: true,
            });
            return false;
          }

          const invalidBlendProperties = Object.entries(rarityConfig)
            .filter(([, layerConfig]) => layerConfig.sets?.[setId]?.active)
            .flatMap(([layerName, layerConfig]) =>
              Object.entries(layerConfig.traits ?? {})
                .filter(([, traitConfig]) => {
                  if (!traitConfig.sets?.[setId]?.enabled) {
                    return false;
                  }

                  const blend =
                    traitConfig.sets?.[setId]?.blend ||
                    layerConfig.defaultBlend ||
                    DEFAULT_BLEND_PROPERTIES;

                  const isValidMode = VALID_BLEND_MODES.includes(blend.mode as BlendMode);
                  const isValidOpacity =
                    typeof blend.opacity === 'number' && blend.opacity >= 0 && blend.opacity <= 1;

                  return !isValidMode || !isValidOpacity;
                })
                .map(([traitName]) => `${layerName}/${traitName}`)
            );

          if (invalidBlendProperties.length > 0) {
            set({
              errorMessage: `Error: Invalid blend properties in set "${setId}" for traits: ${invalidBlendProperties.join(', ')}`,
              isGenerateDisabled: true,
            });
            return false;
          }
        }

        set({ errorMessage: null, isGenerateDisabled: false });
        return true;
      },

      handleWidthChange: (newWidth: number) => {
        const { fixedProportion, finalHeight } = get();
        const { MIN_IMAGE_SIZE } = get();
        const MAX_IMAGE_SIZE = get().getMaxImageSize();
        const validWidth = Math.max(MIN_IMAGE_SIZE, Math.min(MAX_IMAGE_SIZE, newWidth));

        if (fixedProportion) {
          const aspectRatio = finalHeight / get().finalWidth;
          const newHeight = Math.max(
            MIN_IMAGE_SIZE,
            Math.min(MAX_IMAGE_SIZE, Math.round(validWidth * aspectRatio))
          );
          get().setFinalDimensions(validWidth, newHeight);
        } else {
          get().setFinalDimensions(validWidth, finalHeight);
        }
      },

      handleHeightChange: (newHeight: number) => {
        const { fixedProportion, finalWidth } = get();
        const { MIN_IMAGE_SIZE } = get();
        const MAX_IMAGE_SIZE = get().getMaxImageSize();
        const validHeight = Math.max(MIN_IMAGE_SIZE, Math.min(MAX_IMAGE_SIZE, newHeight));

        if (fixedProportion) {
          const aspectRatio = finalWidth / get().finalHeight;
          const newWidth = Math.max(
            MIN_IMAGE_SIZE,
            Math.min(MAX_IMAGE_SIZE, Math.round(validHeight * aspectRatio))
          );
          get().setFinalDimensions(newWidth, validHeight);
        } else {
          get().setFinalDimensions(finalWidth, validHeight);
        }
      },

      toggleFormatDropdown: () => {
        set((state) => ({ isFormatOpen: !state.isFormatOpen }));
      },

      closeFormatDropdown: () => set({ isFormatOpen: false }),

      setImageFormat: (format: string) => {
        set((state) => ({
          ...state,
          selectedFormat: format,
          imageFormat: format,
          isFormatOpen: false,
          errorMessage: null,
          isGenerateDisabled: false,
        }));
        void get().saveState();
      },

      getSliderPercentage: (value: number) => {
        const { MIN_IMAGE_SIZE } = get();
        const MAX_IMAGE_SIZE = get().getMaxImageSize();
        return ((value - MIN_IMAGE_SIZE) / (MAX_IMAGE_SIZE - MIN_IMAGE_SIZE)) * 100;
      },

      validateAndPrepareGeneration: () => {
        const { selectedFormat, finalWidth, finalHeight } = get();

        if (!selectedFormat) {
          set({
            errorMessage: `Error: Invalid image format selected. Please select a valid format.`,
            isGenerateDisabled: true,
          });
          return false;
        }

        if (!finalWidth || !finalHeight) {
          set({
            errorMessage: `Error: Invalid dimensions. Width and height must be set.`,
            isGenerateDisabled: true,
          });
          return false;
        }

        const isConfigValid = get().validateConfiguration();
        const areDimensionsValid = get().validateDimensions();

        if (!isConfigValid || !areDimensionsValid) {
          return false;
        }

        set({
          errorMessage: null,
          isGenerateDisabled: false,
        });

        return true;
      },

      resetState: () => {
        set({
          finalWidth: 1024,
          finalHeight: 1024,
          fixedProportion: true,
          selectedFormat: getIsAnimated() ? 'gif' : 'png',
          errorMessage: null,
          isGenerateDisabled: false,
          isFormatOpen: false,
        });
      },

      setBaseDimensions: (width, height) => {
        set({ baseWidth: width, baseHeight: height });
        const dimensions = get().calculateAspectRatio(width, height);
        set({
          finalWidth: dimensions.width,
          finalHeight: dimensions.height,
        });
        void get().saveState();
      },

      setFinalDimensions: (width, height) => {
        set({ finalWidth: width, finalHeight: height });
        void get().saveState();
      },

      setFixedProportion: (fixed) => {
        set({ fixedProportion: fixed });
        void get().saveState();
      },

      loadPersistedState: async () => {
        const loadEffect = pipe(
          Effect.tryPromise(() => api.loadImageSetupState()),
          Effect.flatMap((state) =>
            Effect.succeed({
              state,
              isValid: state && typeof state === 'object',
            })
          ),
          Effect.flatMap(({ state, isValid }) =>
            Effect.succeed(() => {
              if (isValid) {
                const isAnimated = getIsAnimated();
                const availableFormats = isAnimated
                  ? ['mp4', 'webp', 'webm', 'gif']
                  : ['png', 'jpg', 'webp'];

                set({
                  ...state,
                  selectedFormat: state.imageFormat,
                  imageFormats: availableFormats,
                  errorMessage: null,
                  isGenerateDisabled: false,
                  isFormatOpen: false,
                  blockchains: ['eth', 'sol'],
                });
              } else {
                console.warn('No persisted state found, using backend defaults');
              }
            })
          ),
          Effect.catchAll((error) =>
            Effect.succeed(() => {
              console.error('Error loading persisted state:', error);
            })
          )
        );

        await Effect.runPromise(loadEffect);
      },

      saveState: async () => {
        const saveEffect = pipe(
          Effect.tryPromise(() => {
            const state = get();
            const persistentState: ImageSetupPersistentState = {
              baseWidth: state.baseWidth,
              baseHeight: state.baseHeight,
              finalWidth: state.finalWidth,
              finalHeight: state.finalHeight,
              fixedProportion: state.fixedProportion,
              imageFormat: state.selectedFormat,
              includeSpritesheets: state.includeSpritesheets,
              allowDuplicates: state.allowDuplicates,
              shuffleSets: state.shuffleSets,
              blockchain: state.blockchain,
              solanaConfig: state.solanaConfig,
              animationQuality: state.animationQuality,
              resizeConfig: state.resizeConfig ?? undefined,
            };
            return api.saveImageSetupState(persistentState);
          }),
          Effect.catchAll((error) =>
            Effect.succeed(() => {
              console.error('Error saving state:', error);
            })
          )
        );

        await Effect.runPromise(saveEffect);
      },

      calculateAspectRatio: (width: number, height: number) => {
        const { MIN_IMAGE_SIZE } = get();
        const DEFAULT_IMAGE_SIZE = 1024;
        const MAX_IMAGE_SIZE = get().getMaxImageSize();

        if (width === 0 || height === 0) {
          return {
            width: DEFAULT_IMAGE_SIZE,
            height: DEFAULT_IMAGE_SIZE,
          };
        }

        const aspectRatio = width / height;
        let finalWidth = DEFAULT_IMAGE_SIZE;
        let finalHeight = Math.round(DEFAULT_IMAGE_SIZE / aspectRatio);

        if (finalHeight > MAX_IMAGE_SIZE) {
          finalHeight = MAX_IMAGE_SIZE;
          finalWidth = Math.round(MAX_IMAGE_SIZE * aspectRatio);
        } else if (finalHeight < MIN_IMAGE_SIZE) {
          finalHeight = MIN_IMAGE_SIZE;
          finalWidth = Math.round(MIN_IMAGE_SIZE * aspectRatio);
        }

        if (finalWidth > MAX_IMAGE_SIZE) {
          finalWidth = MAX_IMAGE_SIZE;
          finalHeight = Math.round(MAX_IMAGE_SIZE / aspectRatio);
        } else if (finalWidth < MIN_IMAGE_SIZE) {
          finalWidth = MIN_IMAGE_SIZE;
          finalHeight = Math.round(MIN_IMAGE_SIZE / aspectRatio);
        }

        return {
          width: finalWidth,
          height: finalHeight,
        };
      },
      setAllowDuplicates: (allow) => {
        set({ allowDuplicates: allow });
        void get().saveState();
      },
      setShuffleSets: (value) => {
        set({ shuffleSets: value });
        void get().saveState();
      },
      selectBlockchain: (blockchain) => {
        set({ blockchain });
        void get().saveState();
      },
      updateSolanaConfig: (config) => {
        set((state) => {
          if (!state.solanaConfig) {
            const defaultConfig: SolanaMetadataConfig = {
              symbol: '',
              sellerFeeBasisPoints: 0,
              externalUrl: '',
              creators: [{ address: '', share: 100 }],
              ...config,
            };
            return { solanaConfig: defaultConfig };
          }
          const updatedConfig: SolanaMetadataConfig = {
            symbol: state.solanaConfig.symbol,
            sellerFeeBasisPoints: state.solanaConfig.sellerFeeBasisPoints,
            externalUrl: state.solanaConfig.externalUrl,
            creators: state.solanaConfig.creators,
            ...config,
          };
          return { solanaConfig: updatedConfig };
        });
        void get().saveState();
      },

      updateSolanaCreator: (index, creator) => {
        set((state) => {
          const currentCreators = state.solanaConfig?.creators ?? [{ address: '', share: 100 }];
          const updatedCreators = currentCreators.map((c, i) =>
            i === index ? { ...c, ...creator } : c
          );

          if (!state.solanaConfig) {
            const defaultConfig: SolanaMetadataConfig = {
              symbol: '',
              sellerFeeBasisPoints: 0,
              externalUrl: '',
              creators: updatedCreators,
            };
            return { solanaConfig: defaultConfig };
          }

          const updatedConfig: SolanaMetadataConfig = {
            symbol: state.solanaConfig.symbol,
            sellerFeeBasisPoints: state.solanaConfig.sellerFeeBasisPoints,
            externalUrl: state.solanaConfig.externalUrl,
            creators: updatedCreators,
          };
          return { solanaConfig: updatedConfig };
        });
        void get().saveState();
      },

      addSolanaCreator: () => {
        set((state) => {
          const currentCreators = state.solanaConfig?.creators ?? [{ address: '', share: 100 }];
          if (currentCreators.length >= 4) {
            return state;
          }
          const equalShare = Math.floor(100 / (currentCreators.length + 1));
          const updatedCreators = [
            ...currentCreators.map((c) => ({
              ...c,
              share: equalShare,
            })),
            { address: '', share: equalShare },
          ];

          if (!state.solanaConfig) {
            const defaultConfig: SolanaMetadataConfig = {
              symbol: '',
              sellerFeeBasisPoints: 0,
              externalUrl: '',
              creators: updatedCreators,
            };
            return { solanaConfig: defaultConfig };
          }

          const updatedConfig: SolanaMetadataConfig = {
            symbol: state.solanaConfig.symbol,
            sellerFeeBasisPoints: state.solanaConfig.sellerFeeBasisPoints,
            externalUrl: state.solanaConfig.externalUrl,
            creators: updatedCreators,
          };
          return { solanaConfig: updatedConfig };
        });
        void get().saveState();
      },

      removeSolanaCreator: (index) => {
        set((state) => {
          const currentCreators = state.solanaConfig?.creators ?? [{ address: '', share: 100 }];
          if (currentCreators.length <= 1) {
            return state;
          }
          const equalShare = Math.floor(100 / (currentCreators.length - 1));
          const updatedCreators = currentCreators
            .filter((_, i) => i !== index)
            .map((c) => ({ ...c, share: equalShare }));

          if (!state.solanaConfig) {
            const defaultConfig: SolanaMetadataConfig = {
              symbol: '',
              sellerFeeBasisPoints: 0,
              externalUrl: '',
              creators: updatedCreators,
            };
            return { solanaConfig: defaultConfig };
          }

          const updatedConfig: SolanaMetadataConfig = {
            symbol: state.solanaConfig.symbol,
            sellerFeeBasisPoints: state.solanaConfig.sellerFeeBasisPoints,
            externalUrl: state.solanaConfig.externalUrl,
            creators: updatedCreators,
          };
          return { solanaConfig: updatedConfig };
        });
        void get().saveState();
      },

      updateFormats: () => {
        const isAnimated = getIsAnimated();
        const newFormats = isAnimated ? ['mp4', 'webp', 'webm', 'gif'] : ['png', 'jpg', 'webp'];

        set({
          imageFormats: newFormats,
        });
        void get().saveState();
      },

      setIncludeSpritesheets: (value: boolean) => {
        set({ includeSpritesheets: value });
        void get().saveState();
      },

      updateAnimationQuality: (config) => {
        const state = get();
        const currentConfig = state.animationQuality;

        const newConfig = currentConfig
          ? {
              ...currentConfig,
              ...config,
              formatSpecificSettings: {
                ...currentConfig.formatSpecificSettings,
                ...(config.formatSpecificSettings ?? {}),
              },
            }
          : config;

        set({
          animationQuality: newConfig as AnimationQualityConfig,
        });
        void get().saveState();
      },

      updateResizeConfig: (config) => {
        const state = get();
        const currentConfig = state.resizeConfig;

        const newConfig = currentConfig
          ? {
              ...currentConfig,
              ...config,
            }
          : config;

        set({
          resizeConfig: newConfig as ResizeConfig,
        });
        void get().saveState();
      },
    };
  }
);
